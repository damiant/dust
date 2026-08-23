import SwiftUI

/// Root watch UI. Idle until the iPhone pushes a camp, then live tracking.
struct ContentView: View {
    @EnvironmentObject private var model: WatchViewModel

    var body: some View {
        Group {
            switch model.state {
            case .idle:
                IdleView()
            case .tracking, .arrived:
                TrackingView()
            }
        }
    }
}

/// Shown when no target has been sent yet (and after Stop).
struct IdleView: View {
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "applewatch")
                .font(.system(size: 34))
                .foregroundStyle(.secondary)
            Text("Open Dust on your iPhone")
                .font(.footnote)
            Text("and choose Show on Watch.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

/// Arrow (top), distance (middle), camp label (bottom), stop button.
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
                // Top tick indicates "up" (the direction you're facing).
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
