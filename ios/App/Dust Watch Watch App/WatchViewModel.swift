import Foundation
import Combine
import CoreLocation
import WatchConnectivity
import WatchKit

/// The three watch UI states.
enum WatchState {
    /// Nothing has been sent from the iPhone yet (and after Stop).
    case idle
    /// Live direction/distance to a camp.
    case tracking
    /// Within ~15 m of the destination.
    case arrived
}

/// Owns WatchConnectivity + CoreLocation for the watch companion app.
///
/// The iPhone pushes a camp (`name`, `lat`, `lng`) over WatchConnectivity; this
/// model then tracks the watch's own GPS and computes a live compass-needle
/// direction and straight-line distance to that target.
final class WatchViewModel: NSObject, ObservableObject {
    @Published var state: WatchState = .idle
    @Published var targetName: String?
    @Published var distance: CLLocationDistance = 0
    @Published var arrowRotation: Double = 0
    @Published var signalLost = false

    private var target: CLLocationCoordinate2D?
    private var currentLocation: CLLocation?
    private var heading: Double?

    private let locationManager = CLLocationManager()
    private let session: WCSession

    override init() {
        self.session = WCSession.default
        super.init()

        session.delegate = self
        if WCSession.isSupported() {
            session.activate()
        }

        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.distanceFilter = 5
        locationManager.headingFilter = 5
    }

    func beginTracking(to coordinate: CLLocationCoordinate2D, name: String) {
        target = coordinate
        targetName = name
        locationManager.requestWhenInUseAuthorization()
        state = .tracking
        signalLost = false
        locationManager.startUpdatingLocation()
        locationManager.startUpdatingHeading()
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
        locationManager.stopUpdatingHeading()
        target = nil
        targetName = nil
        currentLocation = nil
        heading = nil
        distance = 0
        arrowRotation = 0
        signalLost = false
        state = .idle
    }

    private func updateDirection() {
        guard let target, let current = currentLocation else { return }
        let from = current.coordinate
        let bearing = Self.bearing(from: from, to: target)
        distance = current.distance(from: CLLocation(latitude: target.latitude, longitude: target.longitude))
        // Rotate the arrow so "up" on screen points toward the destination
        // relative to the direction the wearer is facing.
        let facing = heading ?? current.course
        arrowRotation = Self.normalizeDegrees(bearing - facing)
    }

    /// Great-circle initial bearing (degrees, 0–360) from one coordinate to another.
    static func bearing(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let lat1 = from.latitude * .pi / 180
        let lat2 = to.latitude * .pi / 180
        let dLon = (to.longitude - from.longitude) * .pi / 180
        let y = sin(dLon) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)
        return normalizeDegrees(atan2(y, x) * 180 / .pi)
    }

    static func normalizeDegrees(_ value: Double) -> Double {
        let remainder = value.truncatingRemainder(dividingBy: 360)
        return remainder < 0 ? remainder + 360 : remainder
    }
}

// MARK: - Distance formatting (imperial, straight-line)

extension WatchViewModel {
    var distanceText: String {
        let meters = distance
        if meters >= 160.934 { // ~0.1 mi
            let miles = meters / 1609.344
            return String(format: "%.1f mi", miles)
        } else {
            let feet = meters * 3.28084
            return String(format: "%.0f ft", feet)
        }
    }
}

// MARK: - WCSessionDelegate

extension WatchViewModel: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        let handled = handle(payload: message)
        replyHandler(["ok": handled])
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        if let payload = applicationContext["dustTarget"] as? [String: Any] {
            _ = handle(payload: payload)
        }
    }

    private func handle(payload: [String: Any]) -> Bool {
        guard let name = payload["name"] as? String,
              let lat = payload["lat"] as? Double,
              let lng = payload["lng"] as? Double else {
            return false
        }
        beginTracking(to: CLLocationCoordinate2D(latitude: lat, longitude: lng), name: name)
        return true
    }
}

// MARK: - CLLocationManagerDelegate

extension WatchViewModel: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        currentLocation = location
        signalLost = false
        updateDirection()

        if let target,
           location.distance(from: CLLocation(latitude: target.latitude, longitude: target.longitude)) < 15,
           state == .tracking {
            state = .arrived
            WKInterfaceDevice.current().play(.notification)
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        heading = newHeading.trueHeading > 0 ? newHeading.trueHeading : newHeading.magneticHeading
        updateDirection()
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        signalLost = true
    }
}
