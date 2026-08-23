import CoreLocation
import Foundation

struct WatchPlace: Identifiable, Equatable {
    let id: String
    let name: String
    let lat: Double?
    let lng: Double?

    var coordinate: CLLocationCoordinate2D? {
        guard let lat, let lng else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

struct WatchTimed: Identifiable, Equatable {
    let id: String
    let name: String
    let start: Date
    let end: Date
    let when: String?
    let lat: Double?
    let lng: Double?

    var coordinate: CLLocationCoordinate2D? {
        guard let lat, let lng else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }

    func isUpcoming(at now: Date) -> Bool {
        end > now
    }
}

struct WatchPoint: Identifiable, Equatable {
    let id: String
    let lat: Double
    let lng: Double

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }

    var location: CLLocation {
        CLLocation(latitude: lat, longitude: lng)
    }
}

struct WatchCatalog: Equatable {
    var camps: [WatchPlace] = []
    var art: [WatchPlace] = []
    var events: [WatchTimed] = []
    var restrooms: [WatchPoint] = []
    var ice: [WatchPoint] = []

    static func parse(_ json: String) -> WatchCatalog? {
        guard let data = json.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return WatchCatalog(
            camps: places(from: obj["camps"]),
            art: places(from: obj["art"]),
            events: timed(from: obj["events"]),
            restrooms: points(from: obj["restrooms"]),
            ice: points(from: obj["ice"])
        )
    }

    private static func places(from value: Any?) -> [WatchPlace] {
        guard let rows = value as? [[String: Any]] else { return [] }
        return rows.enumerated().compactMap { index, row in
            guard let name = row["name"] as? String, !name.isEmpty else { return nil }
            return WatchPlace(id: "\(index)-\(name)", name: name, lat: jsonDouble(row["lat"]), lng: jsonDouble(row["lng"]))
        }
    }

    private static func timed(from value: Any?) -> [WatchTimed] {
        guard let rows = value as? [[String: Any]] else { return [] }
        return rows.enumerated().compactMap { index, row in
            guard let name = row["name"] as? String, !name.isEmpty,
                  let start = jsonDouble(row["start"]),
                  let end = jsonDouble(row["end"]) else { return nil }
            return WatchTimed(
                id: "\(index)-\(name)-\(start)",
                name: name,
                start: Date(timeIntervalSince1970: start / 1000),
                end: Date(timeIntervalSince1970: end / 1000),
                when: row["when"] as? String,
                lat: jsonDouble(row["lat"]),
                lng: jsonDouble(row["lng"])
            )
        }
    }

    private static func points(from value: Any?) -> [WatchPoint] {
        guard let rows = value as? [[String: Any]] else { return [] }
        return rows.enumerated().compactMap { index, row in
            guard let lat = jsonDouble(row["lat"]), let lng = jsonDouble(row["lng"]) else { return nil }
            return WatchPoint(id: "\(index)-\(lat)-\(lng)", lat: lat, lng: lng)
        }
    }
}

private func jsonDouble(_ value: Any?) -> Double? {
    if let n = value as? NSNumber { return n.doubleValue }
    if let d = value as? Double { return d }
    if let i = value as? Int { return Double(i) }
    return nil
}
