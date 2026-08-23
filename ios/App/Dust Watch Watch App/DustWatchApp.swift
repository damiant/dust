import SwiftUI

@main
struct DustWatchApp: App {
    @StateObject private var model = WatchViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
        }
    }
}
