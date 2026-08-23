import Foundation
import Capacitor
import WatchConnectivity

/// Bridges the Angular "Show on Watch" flow to the paired Apple Watch via
/// WatchConnectivity. Registered natively (see AppBridgeViewController) and
/// invoked from `WatchService` in src/app/watch/watch.service.ts.
@objc(WatchConnectivityPlugin)
class WatchConnectivityPlugin: CAPInstancePlugin, CAPBridgedPlugin, WCSessionDelegate {

    let identifier = "WatchConnectivityPlugin"
    let jsName = "WatchConnectivity"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isWatchAppInstalled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendCamp", returnType: CAPPluginReturnPromise),
    ]

    private let session: WCSession

    /// Calls awaiting WCSession activation before they can report readiness.
    private var pendingInstalledCalls: [CAPPluginCall] = []

    override init() {
        self.session = WCSession.default
        super.init()
        if WCSession.isSupported() {
            session.delegate = self
            session.activate()
        }
    }

    // MARK: - Plugin methods

    /// Reports whether a Dust Apple Watch companion app is installed & paired.
    /// Waits for WCSession activation before reading `isWatchAppInstalled`, since
    /// this flag only reflects reality once the session is `.activated`.
    @objc func isWatchAppInstalled(_ call: CAPPluginCall) {
        guard WCSession.isSupported() else {
            call.resolve(["installed": false])
            return
        }
        guard session.activationState == .activated else {
            // Not yet active — hold the call and resolve once activation completes.
            pendingInstalledCalls.append(call)
            session.activate()
            return
        }
        call.resolve(["installed": session.isWatchAppInstalled])
    }

    /// Sends a camp (name + center GPS) to the watch. Prefers a live message
    /// when the watch app is reachable, otherwise stores it in the application
    /// context so the watch picks it up the moment it becomes active.
    @objc func sendCamp(_ call: CAPPluginCall) {
        guard let name = call.getString("name"),
              let lat = call.getDouble("lat"),
              let lng = call.getDouble("lng") else {
            call.reject("Missing camp name or coordinates")
            return
        }

        guard WCSession.isSupported(), session.activationState == .activated else {
            call.reject("The Watch session is not activated.")
            return
        }

        guard session.isWatchAppInstalled else {
            call.reject("The Dust Apple Watch app is not installed.")
            return
        }

        let payload: [String: Any] = ["type": "camp", "name": name, "lat": lat, "lng": lng]

        if session.isReachable {
            session.sendMessage(payload, replyHandler: { reply in
                let ok = (reply["ok"] as? Bool) ?? true
                call.resolve(["success": ok])
            }, errorHandler: { error in
                call.reject(error.localizedDescription)
            })
        } else {
            // Watch app not foregrounded; persist for the watch to consume later.
            do {
                try session.updateApplicationContext(["dustTarget": payload])
                call.resolve(["success": true])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let pending = pendingInstalledCalls
        pendingInstalledCalls.removeAll()
        let installed = (activationState == .activated) && session.isWatchAppInstalled
        pending.forEach { $0.resolve(["installed": installed]) }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        // Re-activate so future sends keep working after switching watches.
        WCSession.default.activate()
    }
}
