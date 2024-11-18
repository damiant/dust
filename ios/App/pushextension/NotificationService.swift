//
//  NotificationService.swift
//  pushextension
//
//  Created by Damian (Work) on 11/18/24.
//

import UserNotifications
import FirebaseMessaging

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
      guard let content = request.content.mutableCopy() as? UNMutableNotificationContent else { return }
              self.contentHandler = contentHandler
              self.bestAttemptContent = content

              FIRMessagingExtensionHelper().populateNotificationContent(content, withContentHandler: contentHandler)
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
      guard let contentHandler = contentHandler,
            let bestAttemptContent =  bestAttemptContent else { return }

      contentHandler(bestAttemptContent)
    }

}
