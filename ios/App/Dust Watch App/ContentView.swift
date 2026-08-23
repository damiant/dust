import CoreLocation
import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: WatchViewModel

    var body: some View {
        Group {
            switch model.state {
            case .idle:
                if model.hasCatalog {
                    CatalogHomeView()
                } else {
                    EmptyCatalogView()
                }
            case .tracking, .arrived:
                TrackingView()
            }
        }
    }
}

struct EmptyCatalogView: View {
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "applewatch")
                .font(.system(size: 34))
                .foregroundStyle(.secondary)
            Text("Update Watch from Favorites")
                .font(.footnote)
                .multilineTextAlignment(.center)
            Text("on your iPhone.")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

struct CatalogHomeView: View {
    @EnvironmentObject private var model: WatchViewModel

    var body: some View {
        NavigationStack {
            List {
                Button {
                    model.navigateToNearest(.restroom)
                } label: {
                    Label("Restroom", systemImage: "toilet")
                }

                Button {
                    model.navigateToNearest(.ice)
                } label: {
                    Label("Ice", systemImage: "snowflake")
                }

                NavigationLink {
                    PlaceListView(title: "Camps", kind: .camp)
                } label: {
                    Label("Camps", systemImage: "tent")
                }

                NavigationLink {
                    PlaceListView(title: "Art", kind: .art)
                } label: {
                    Label("Art", systemImage: "paintpalette")
                }

                NavigationLink {
                    EventListView()
                } label: {
                    Label("Events", systemImage: "calendar")
                }
            }
            .navigationTitle("Dust")
            .onAppear { model.startBrowsingLocation() }
        }
    }
}

enum PlaceKind {
    case camp
    case art
}

struct PlaceListView: View {
    @EnvironmentObject private var model: WatchViewModel
    let title: String
    let kind: PlaceKind

    private var places: [WatchPlace] {
        kind == .camp ? model.campsByDistance : model.artByDistance
    }

    var body: some View {
        List {
            if places.isEmpty {
                Text("Star items on iPhone, then Update Watch.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            ForEach(places) { place in
                if let coordinate = place.coordinate {
                    Button {
                        model.beginTracking(to: coordinate, name: place.name)
                    } label: {
                        placeRow(place, coordinate: coordinate)
                    }
                    .buttonStyle(.plain)
                } else {
                    placeRow(place, coordinate: nil)
                }
            }
        }
        .navigationTitle(title)
    }

    private func placeRow(_ place: WatchPlace, coordinate: CLLocationCoordinate2D?) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(place.name)
                .foregroundStyle(coordinate == nil ? .secondary : .primary)
                .lineLimit(2)
            if let distance = model.formattedDistance(to: coordinate) {
                Text(distance)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct EventListView: View {
    @EnvironmentObject private var model: WatchViewModel

    var body: some View {
        List {
            if model.upcomingEvents.isEmpty {
                Text("No upcoming Events or Parties.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            ForEach(model.upcomingEvents) { event in
                if let coordinate = event.coordinate {
                    Button {
                        model.beginTracking(to: coordinate, name: event.name)
                    } label: {
                        eventRow(event, tappable: true)
                    }
                    .buttonStyle(.plain)
                } else {
                    eventRow(event, tappable: false)
                }
            }
        }
        .navigationTitle("Events")
    }

    private func eventRow(_ event: WatchTimed, tappable: Bool) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(event.name)
                .foregroundStyle(tappable ? .primary : .secondary)
                .lineLimit(2)
            Text(event.when ?? Self.whenText(event.start))
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private static func whenText(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE h:mma"
        return formatter.string(from: date)
    }
}

struct TrackingView: View {
    @EnvironmentObject private var model: WatchViewModel

    var body: some View {
        VStack(spacing: 6) {
            DirectionArrowView(rotation: model.arrowRotation, arrived: model.state == .arrived)
                .frame(width: 110, height: 110)

            Text(model.distanceText)
                .font(.title3.weight(.semibold))
                .monospacedDigit()
                .lineLimit(1)

            Text(model.targetName ?? "")
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            if model.state == .arrived {
                Text("You've arrived")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.green)
            } else if model.signalLost {
                Text("Weak signal")
                    .font(.caption2)
                    .foregroundStyle(.orange)
            }

            Button("Stop") {
                model.stopTracking()
            }
            .buttonStyle(.bordered)
            .tint(.red)
        }
        .padding(.vertical, 4)
    }
}

/// Compass-needle style arrow. Rotates so "up" on screen points toward the
/// destination relative to the direction the wearer is facing.
struct DirectionArrowView: View {
    let rotation: Double
    let arrived: Bool

    var body: some View {
        ZStack {
            Circle()
                .strokeBorder(
                    arrived ? Color.green.opacity(0.6) : Color.primary.opacity(0.2),
                    lineWidth: 2
                )

            if arrived {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 58))
                    .foregroundStyle(.green)
            } else {
                Image(systemName: "triangle.fill")
                    .font(.system(size: 6))
                    .foregroundStyle(.secondary)
                    .offset(y: -44)

                Image(systemName: "location.north.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(Color.primary)
                    .rotationEffect(.degrees(rotation))
                    .animation(.easeOut(duration: 0.2), value: rotation)
            }
        }
    }
}
