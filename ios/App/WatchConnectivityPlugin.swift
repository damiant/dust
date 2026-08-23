import Foundation
import Capacitor
import WatchConnectivity

/// Bridges the Angular "Update Watch" flow to the paired Apple Watch via
/// WatchConnectivity. Registered natively (see AppBridgeViewController) and
/// invoked from `WatchService` in src/app/watch/watch.service.ts.
@objc(WatchConnectivityPlugin)
class WatchConnectivityPlugin: CAPInstancePlugin, CAPBridgedPlugin, WCSessionDelegate {

    let identifier = "WatchConnectivityPlugin"
    let jsName = "WatchConnectivity"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isWatchAppInstalled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "sendCatalog", returnType: CAPPluginReturnPromise),
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
            pendingInstalledCalls.append(call)
            session.activate()
            return
        }
        call.resolve(["installed": session.isWatchAppInstalled])
    }

    /// Replaces the Watch Catalog. Always writes application context so a closed
    /// watch app picks it up on open; also sends a live message when reachable.
    @objc func sendCatalog(_ call: CAPPluginCall) {
        guard let catalogJson = call.getString("catalogJson"), !catalogJson.isEmpty else {
            call.reject("Missing catalog")
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

        do {
            try session.updateApplicationContext(["dustCatalog": catalogJson])
        } catch {
            call.reject(error.localizedDescription)
            return
        }

        let payload: [String: Any] = ["type": "catalog", "catalogJson": catalogJson]
        if session.isReachable {
            session.sendMessage(payload, replyHandler: { _ in
                call.resolve(["success": true])
            }, errorHandler: { _ in
                // Context already persisted; the watch will read it on open.
                call.resolve(["success": true])
            })
        } else {
            call.resolve(["success": true])
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
        WCSession.default.activate()
    }
}
