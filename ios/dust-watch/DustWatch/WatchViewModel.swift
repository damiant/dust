import Combine
import CoreLocation
import Foundation
import WatchConnectivity
import WatchKit

enum WatchState {
    /// Chooser (or empty prompt) when not navigating.
    case idle
    /// Live direction/distance to a Watch Destination.
    case tracking
    /// Within ~15 m of the destination.
    case arrived
}

enum WatchAmenity {
    case restroom
    case ice
    case medical

    var title: String {
        switch self {
        case .restroom: return "Restroom"
        case .ice: return "Ice"
        case .medical: return "Medical"
        }
    }
}

/// Owns WatchConnectivity + CoreLocation for the watch companion app.
///
/// The iPhone pushes a Watch Catalog over WatchConnectivity. This model
/// chooses locally (nearest Restroom/Ice/Medical, Favorite lists) and tracks the
/// watch's own GPS for a compass-needle and live straight-line distance.
final class WatchViewModel: NSObject, ObservableObject {
    @Published var state: WatchState = .idle
    @Published var targetName: String?
    @Published var distance: CLLocationDistance = 0
    @Published var arrowRotation: Double = 0
    @Published var signalLost = false
    @Published var catalog = WatchCatalog()
    @Published private(set) var hasCatalog = false
    @Published private(set) var currentLocation: CLLocation?
    @Published var now = Date()

    private var target: CLLocationCoordinate2D?
    private var heading: Double?
    private var pendingAmenity: WatchAmenity?
    private var clockTimer: Timer?

    private let locationManager = CLLocationManager()
    private let session: WCSession
    private let catalogDefaultsKey = "dustCatalogJSON"

    override init() {
        self.session = WCSession.default
        super.init()

        if let json = UserDefaults.standard.string(forKey: catalogDefaultsKey) {
            applyCatalogJSON(json, persist: false)
        }

        session.delegate = self
        if WCSession.isSupported() {
            session.activate()
        }

        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.distanceFilter = 5
        locationManager.headingFilter = 5

        clockTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            DispatchQueue.main.async { self?.now = Date() }
        }
        if let clockTimer {
            RunLoop.main.add(clockTimer, forMode: .common)
        }

        if hasCatalog {
            startBrowsingLocation()
        }
    }

    deinit {
        clockTimer?.invalidate()
    }

    var upcomingEvents: [WatchTimed] {
        catalog.events.filter { $0.isUpcoming(at: now) }.sorted { $0.start < $1.start }
    }

    var upcomingReminders: [WatchTimed] {
        catalog.reminders.filter { $0.isUpcoming(at: now) }.sorted { $0.start < $1.start }
    }

    var campsByDistance: [WatchPlace] {
        sortedByDistance(catalog.camps)
    }

    var artByDistance: [WatchPlace] {
        sortedByDistance(catalog.art)
    }

    var friendsByDistance: [WatchPlace] {
        sortedByDistance(catalog.friends)
    }

    func beginTracking(to coordinate: CLLocationCoordinate2D, name: String) {
        target = coordinate
        targetName = name
        pendingAmenity = nil
        startBrowsingLocation()
        locationManager.startUpdatingHeading()
        state = .tracking
        signalLost = false
        updateDirection()
    }

    func stopTracking() {
        locationManager.stopUpdatingHeading()
        target = nil
        targetName = nil
        heading = nil
        distance = 0
        arrowRotation = 0
        signalLost = false
        pendingAmenity = nil
        state = .idle
        if !hasCatalog {
            locationManager.stopUpdatingLocation()
            currentLocation = nil
        }
    }

    func navigateToNearest(_ amenity: WatchAmenity) {
        let points: [WatchPoint]
        switch amenity {
        case .restroom: points = catalog.restrooms
        case .ice: points = catalog.ice
        case .medical: points = catalog.medical
        }
        guard !points.isEmpty else {
            WKInterfaceDevice.current().play(.failure)
            return
        }
        if let here = currentLocation {
            startNearest(points: points, name: amenity.title, from: here)
        } else {
            pendingAmenity = amenity
            startBrowsingLocation()
        }
    }

    func formattedDistance(to coordinate: CLLocationCoordinate2D?) -> String? {
        guard let coordinate, let here = currentLocation else { return nil }
        let meters = here.distance(from: CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude))
        return Self.formatDistance(meters)
    }

    var distanceText: String {
        Self.formatDistance(distance)
    }

    func startBrowsingLocation() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }

    private func startNearest(points: [WatchPoint], name: String, from here: CLLocation) {
        guard let closest = points.min(by: { here.distance(from: $0.location) < here.distance(from: $1.location) }) else {
            return
        }
        beginTracking(to: closest.coordinate, name: name)
    }

    private func sortedByDistance(_ places: [WatchPlace]) -> [WatchPlace] {
        guard let here = currentLocation else { return places }
        return places.sorted { a, b in
            distance(from: here, to: a.coordinate) < distance(from: here, to: b.coordinate)
        }
    }

    private func distance(from here: CLLocation, to coordinate: CLLocationCoordinate2D?) -> CLLocationDistance {
        guard let coordinate else { return .greatestFiniteMagnitude }
        return here.distance(from: CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude))
    }

    private func applyCatalogJSON(_ json: String, persist: Bool) {
        guard let parsed = WatchCatalog.parse(json) else { return }
        catalog = parsed
        hasCatalog = true
        if persist {
            UserDefaults.standard.set(json, forKey: catalogDefaultsKey)
        }
        startBrowsingLocation()
    }

    private func updateDirection() {
        guard let target, let current = currentLocation else { return }
        let from = current.coordinate
        let bearing = Self.bearing(from: from, to: target)
        distance = current.distance(from: CLLocation(latitude: target.latitude, longitude: target.longitude))
        let facing = heading ?? current.course
        arrowRotation = Self.normalizeDegrees(bearing - facing)
    }

    static func formatDistance(_ meters: CLLocationDistance) -> String {
        if meters >= 160.934 {
            let miles = meters / 1609.344
            return String(format: "%.1f mi", miles)
        }
        let feet = meters * 3.28084
        return String(format: "%.0f ft", feet)
    }

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

extension WatchViewModel: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        guard activationState == .activated else { return }
        if let json = session.receivedApplicationContext["dustCatalog"] as? String {
            DispatchQueue.main.async { self.applyCatalogJSON(json, persist: true) }
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        let handled = handle(payload: message)
        replyHandler(["ok": handled])
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        _ = handle(payload: applicationContext)
    }

    private func handle(payload: [String: Any]) -> Bool {
        let json = (payload["catalogJson"] as? String) ?? (payload["dustCatalog"] as? String)
        guard let json else { return false }
        DispatchQueue.main.async { self.applyCatalogJSON(json, persist: true) }
        return true
    }
}

extension WatchViewModel: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        currentLocation = location
        signalLost = false
        updateDirection()

        if let amenity = pendingAmenity {
            pendingAmenity = nil
            navigateToNearest(amenity)
        }

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
