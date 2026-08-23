import UIKit
import Capacitor

/// Root bridge view controller used by the Capacitor iOS app. Registers the
/// custom `WatchConnectivityPlugin` once the Capacitor bridge is created.
///
/// To enable: point the Main storyboard's initial view controller at this class
/// (see docs/watch-app.md) and make sure this file is in the app target.
class AppBridgeViewController: CAPBridgeViewController {

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        NSLog("[App] capacitorDidLoad fired; bridge=%@", String(describing: self.bridge))
        guard let bridge = self.bridge else {
            NSLog("[App] bridge is nil - WatchConnectivityPlugin NOT registered")
            return
        }
        bridge.registerPluginInstance(WatchConnectivityPlugin())
        NSLog("[App] registered WatchConnectivityPlugin")
    }
}
