import UIKit
import Capacitor

/// Root bridge view controller used by the Capacitor iOS app. Registers the
/// custom `WatchConnectivityPlugin` once the Capacitor bridge is created.
///
/// To enable: point the Main storyboard's initial view controller at this class
/// (see docs/watch-app.md) and make sure both files are in the app target.
class AppBridgeViewController: CAPBridgeViewController {

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        guard let bridge = self.bridge else { return }
        bridge.registerPluginInstance(WatchConnectivityPlugin())
    }
}
