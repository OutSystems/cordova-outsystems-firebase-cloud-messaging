@_implementationOnly import FirebaseCore
@_implementationOnly import FirebaseMessaging
import UIKit

/// Application Delegate object responsible for managing the app's shared behaviours.
public class FirebaseMessagingApplicationDelegate: NSObject,
                                                   UIApplicationDelegate {
    
    /// Object that manages all accesses to the Core Data layer.
    public lazy var coreDataManager = CoreDataManager()
    
    /// Object that manages notification sending and storage on Core Data.
    public lazy var notificationManager = NotificationManager(coreDataManager: coreDataManager)
    
    /// Singleton object that provides access to this class.
    @objc public static let shared = FirebaseMessagingApplicationDelegate()
    
    /// Object that handles handle token updates or data message delivery.
    private let firebaseMessagingDelegate = FirebaseMessagingDelegate()
    
    ///  Object that configures the necessary files to enable Firebase Cloud Messaging
    private let firebaseConfiguration: FirebaseConfiguration
    
    /// Object that triggers events managed by related classes
    public var eventDelegate: FirebaseMessagingEventProtocol?
    
    /// Constructor method
    /// - Parameter firebaseConfiguration: Configuration object for Firebase Cloud Messaging. A default value is provided
    private init(firebaseConfiguration: FirebaseConfiguration = FirebaseConfiguration()) {
        self.firebaseConfiguration = firebaseConfiguration
    }
    
    /// Informs the delegate that the launch process is almost done and the app is ready to run. It sets the Firebase Cloud Messaging configuration and informs that the app is ready to deal with Push Notifications.
    /// - Parameters:
    ///   - application: App object.
    ///   - launchOptions: Dictionary indicating the reason the app was launched.
    /// - Returns:Informs that it's ready to work.
    public func application(_ application: UIApplication,
                            didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        
        if FirebaseApp.app() == nil && self.firebaseConfiguration.getGoogleServicesPath() != nil {
            // Initialize Firebase SDK
            FirebaseApp.configure()
            Messaging.messaging().delegate = firebaseMessagingDelegate
        }
        
        UIApplication.shared.registerForRemoteNotifications()
        
        return true
    }
    
    /// Informs the app that a remove notification arrived and needs to be dealt with. In case of a silent, it calls the notification handler in order to trigger an event or save it on Core Data.
    /// - Parameters:
    ///   - application: App object.
    ///   - userInfo: Dictionary that contains information related to the remote notification.
    ///   - completionHandler: Block to execute when the download operation is complete.
    public func application(_ application: UIApplication,
                            didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                            fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        var result = UIBackgroundFetchResult.noData
        
        if let userInfo = userInfo as? NotificationDictionary {
            result = .newData
            if let aps = userInfo[JSONKeys.aps] as? NotificationDictionary, !aps.keys.contains(JSONKeys.alert) {    // check if it's silent
                self.handle(remoteNotification: userInfo, eventType: .trigger(notification: .silentNotification), forApplication: application)
            }
        }
        
        completionHandler(result)
    }
    
    /// Informs the delegate that the app successfully registered with Apple Push Notification service (APNs).
    /// - Parameters:
    ///   - application: App object.
    ///   - deviceToken: A globally unique token that identifies this device to APNs.
    public func application(_ application: UIApplication,
                            didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
    
}

// MARK: - UNUserNotificationCenterDelegate Methods
extension FirebaseMessagingApplicationDelegate: UNUserNotificationCenterDelegate {
    /// Asks the delegate how to handle a notification that arrived while the app was running in the foreground. It checks if the notification should be shown as a dialog.
    /// - Parameters:
    ///   - center: Shared user notification center object that received the notification.
    ///   - notification: Notification that is about to be delivered.
    ///   - completionHandler: Block to execute with the presentation option for the notification.
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       willPresent notification: UNNotification,
                                       withCompletionHandler completionHandler: (UNNotificationPresentationOptions) -> Void) {
        var presentationOptions: UNNotificationPresentationOptions = [.alert, .sound, .badge]
        
        if let userInfo = notification.request.content.userInfo as? NotificationDictionary,
           self.handleAsDialog(defaultNotification: userInfo) {
            presentationOptions = []
        }
        
        completionHandler(presentationOptions)
    }
    
    /// Asks the delegate to process the user's response to a delivered notification. In case there's a deep link in the notification, it handles it in order to route the application accordingly.
    /// - Parameters:
    ///   - center: Shared user notification center object that received the notification.
    ///   - response: User’s response to the notification.
    ///   - completionHandler: Block to execute when you have finished processing the user’s response.
    public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        if let userInfo = response.notification.request.content.userInfo as? NotificationDictionary {
            self.handleClick(onNotification: userInfo)
        }

        completionHandler()
    }
}

// MARK: - MessagingDelegate Methods

/// A protocol to handle token updates or data message delivery
private class FirebaseMessagingDelegate: NSObject, MessagingDelegate {
    /// Called once a token is available or has been refresh.
    /// - Parameters:
    ///   - messaging: Messaging object.
    ///   - fcmToken: Token triggered.
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("FCM Token retrieved: \(String(describing: fcmToken))")
    }
}

// MARK: - FirebaseMessagingApplicationDelegate's Structs and Methods
extension FirebaseMessagingApplicationDelegate {
    /// Alias for a notification dictionary structure
    typealias NotificationDictionary = [String: Any]
    
    /// Contains all keys required to deal with a notification received or to send as a JSON object.`
    struct JSONKeys {
        static let googleCSenderId = "google.c.sender.id"
        static let gcmMessageId = "gcm.message_id"
        static let googleCFid = "google.c.fid"
        static let googleCAE = "google.c.a.e"
        static let aps = "aps"
        static let alert = "alert"
        static let contentAvailable = "content-available"
        static let timeToLive = "timeToLive"
        static let showDialog = "showDialog"
        static let title = "title"
        static let body = "body"
        static let deepLink = "deepLink"
        
        static let messageID = "messageID"
        static let extraDataList = "extraDataList"
        static let key = "key"
        static let value = "value"
    }
    
    /// Handles a remote notification according to it's type and event. It can either call the callback or save a notification on Core Data.
    /// - Parameters:
    ///   - notification: Notification object received or clicked by the user
    ///   - type: Trigger event type.
    ///   - application: Application object. Default value is provided.
    func handle(remoteNotification notification: NotificationDictionary, eventType type: FirebaseEventType, forApplication application: UIApplicationProtocol = UIApplication.shared) {
        guard let data = self.getDataFor(userInfo: notification) else { return }
        if case let .trigger(notificationType) = type, notificationType == .silentNotification, application.getApplicationState() != .active {
            self.saveNotification(userInfo: data)
        } else {
            self.trigger(event: type, forNotification: data)
        }
    }
    
    /// Handles a click on a Push Notification. In case of deep link, it triggers a redirect event.
    /// - Parameter notification: Notification object clicked by the user.
    func handleClick(onNotification notification: NotificationDictionary) {
        if notification.keys.contains(JSONKeys.deepLink) {
            self.handle(remoteNotification: notification, eventType: .click)
        }
    }
    
    /// Checks if the notification should be displayed as a dialog or not.
    /// - Parameter notification: Notification object received.
    /// - Returns: Indicates if it is to be shown as a dialog or a normal Push Notification.
    func handleAsDialog(defaultNotification notification: NotificationDictionary) -> Bool {
        var result = false
        
        if let showDialogString = notification[JSONKeys.showDialog] as? String,
           let showDialogBool = Bool(showDialogString),
           showDialogBool {
            self.handle(remoteNotification: notification, eventType: .trigger(notification: .defaultNotification))
            result = true
        }
        
        return result
    }
    
    /// Converts the notification into a format expected by the callback delegate.
    /// - Parameter userInfo: Notification object received.
    /// - Returns: Notification object to be sent along on the event trigger.
    private func getDataFor(userInfo: NotificationDictionary) -> NotificationDictionary? {
        guard let messageID = userInfo[JSONKeys.gcmMessageId] else { return nil }
        var result: NotificationDictionary = [JSONKeys.messageID: messageID]
        
        let fieldsToExclude = [
            JSONKeys.googleCSenderId, JSONKeys.gcmMessageId, JSONKeys.googleCFid, JSONKeys.googleCAE, JSONKeys.aps, JSONKeys.timeToLive,
            JSONKeys.showDialog, JSONKeys.deepLink
        ]
        let extraData = userInfo.filter { !fieldsToExclude.contains($0.key) }.map { [JSONKeys.key: $0.key, JSONKeys.value: $0.value] }
        if !extraData.isEmpty {
            result[JSONKeys.extraDataList] = extraData
        }
        
        if let timeToLive = userInfo[JSONKeys.timeToLive] {
            result[JSONKeys.timeToLive] = timeToLive
        }
        
        if let aps = userInfo[JSONKeys.aps] as? NotificationDictionary, let alert = aps[JSONKeys.alert] as? NotificationDictionary {
            if let title = alert[JSONKeys.title] {
                result[JSONKeys.title] = title
            }
            
            if let body = alert[JSONKeys.body] {
                result[JSONKeys.body] = body
            }
        }
        
        if let deepLink = userInfo[JSONKeys.deepLink] {
            result[JSONKeys.deepLink] = deepLink
        }
        
        return result
    }
    
    /// Triggers the input event along with its data, if all conditions are met.
    /// - Parameters:
    ///   - event: Event to be triggered.
    ///   - notification: Notification data to be sent on trigger.
    private func trigger(event: FirebaseEventType, forNotification notification: NotificationDictionary) {
        // notification has to be filled with at least two elements
        if notification.count > 1,
           let jsonData = try? JSONSerialization.data(withJSONObject: notification),
           let data = String(data: jsonData, encoding: .utf8) {
            self.eventDelegate?.event(event, data: data)
        }
    }
    
    /// Stores the notification on Core Data if all required data is available.
    /// - Parameter userInfo: Notification to be stored.
    private func saveNotification(userInfo: NotificationDictionary) {
        if let messageID = userInfo[JSONKeys.messageID] as? String,
           let timeToLive = userInfo[JSONKeys.timeToLive] as? String,
           let extraData = userInfo[JSONKeys.extraDataList] as? [NotificationDictionary] {
            
            let notificationDict: [String: Any] = [
                OSFCMNotification.CodingKeys.messageID.rawValue: messageID,
                OSFCMNotification.CodingKeys.timeToLive.rawValue: timeToLive,
                OSFCMNotification.CodingKeys.extraDataList.rawValue: extraData,
                OSFCMNotification.CodingKeys.timeStamp.rawValue: Date().millisecondsSince1970
            ]
            _ = notificationManager.insertNotification(notificationDict: notificationDict)
        }
    }
    
}
