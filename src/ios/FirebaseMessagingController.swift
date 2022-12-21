import UIKit
import UserNotifications
@_implementationOnly import FirebaseCore
@_implementationOnly import FirebaseMessaging

open class FirebaseMessagingController: NSObject {
    private let firebaseManager: MessagingProtocol?
    private let delegate: FirebaseMessagingCallbackProtocol?
    private let configuration: FirebaseConfiguration
    private let application: UIApplicationProtocol
    
    private var coreDataManager: CoreDataManager
    private var notificationManager: NotificationManager
    
    init(delegate: FirebaseMessagingCallbackProtocol,
         firebaseManager: MessagingProtocol,
         configuration: FirebaseConfiguration,
         application: UIApplicationProtocol,
         coreDataManager: CoreDataManager,
         notificationManager: NotificationManager) {
        self.delegate = delegate
        self.configuration = configuration
        self.firebaseManager = firebaseManager
        self.application = application
        self.coreDataManager = coreDataManager
        self.notificationManager = notificationManager
        super.init()
    }
    
    public convenience init(delegate: FirebaseMessagingCallbackProtocol,
                            firebaseManager: MessagingManager = MessagingManager(),
                            coreDataManager: CoreDataManager = CoreDataManager()) {
        let firebaseConfiguration = FirebaseConfiguration()
        let notificationManager = NotificationManager(coreDataManager: coreDataManager)
        let sharedApplication = UIApplication.shared
        self.init(delegate: delegate,
                  firebaseManager: firebaseManager,
                  configuration: firebaseConfiguration,
                  application: sharedApplication,
                  coreDataManager: coreDataManager,
                  notificationManager: notificationManager)
    }
    
    public func getPendingNotifications(clearFromDatabase: Bool=false) {
        if case .success(let notifications) = notificationManager.fetchNotifications() {
            if notifications.isEmpty {
                self.delegate?.callbackSuccess()
            } else {
                if clearFromDatabase, case .failure = notificationManager.deletePendingNotifications(notifications) {
                    self.delegate?.callbackError(error: .deleteNotificationsError)
                } else {
                    self.delegate?.callback(result: notifications.encode())
                }
            }
        } else {
            self.delegate?.callbackError(error: .obtainSilentNotificationsError)
        }
    }
    
    // MARK: Token Public Methods
    public func getToken(ofType type: OSFCMTokenType = .fcm) async {
        do {
            let token = try await self.firebaseManager?.getToken(of: type) ?? ""
            let topic = self.firebaseManager?.getGeneralTopic() ?? ""
            try await self.subscribe(topic, token: token)
        } catch let error as FirebaseMessagingErrors {
            self.delegate?.callbackError(error: error)
        } catch {
            self.delegate?.callbackError(error: .obtainingTokenError)
        }
    }
    
    public func deleteToken() async {
        do {
            try await self.firebaseManager?.deleteToken()
            self.delegate?.callbackSuccess()
        } catch {
            self.delegate?.callbackError(error: .deletingTokenError)
        }
    }
    
    // MARK: Public Subscription Methods
    public func subscribe(_ topic: String, token: String = "") async throws {
        do {
            _ = try await self.firebaseManager?.subscribe(toTopic: topic)
            if token.isEmpty {
                self.delegate?.callbackSuccess()
            } else {
                self.delegate?.callback(result: token)
            }
        } catch {
            throw FirebaseMessagingErrors.subscriptionError
        }
    }
    
    public func unsubscribe(fromTopic topic: String) async throws {
        do {
            _ = try await self.firebaseManager?.unsubscribe(fromTopic: topic)
            self.delegate?.callbackSuccess()
        } catch {
            throw FirebaseMessagingErrors.unsubscriptionError
        }
    }
    
    public func clearNotifications() {
        notificationManager.removeAllDeliveredNotifications()
        self.delegate?.callbackSuccess()
    }
    
    public func sendLocalNotification(title: String, body: String, badge: Int) async {
        let result = await notificationManager.sendLocalNotification(title: title, body: body, badge: badge)
        if case .failure = result {
            self.delegate?.callbackError(error: .sendNotificationsError)
        } else {
            self.delegate?.callbackSuccess()
        }
    }
    
    public func setBadge(badge: Int) {
        self.application.setBadge(badge: badge)
        self.delegate?.callbackSuccess()
    }
    
    public func getBadge() {
        self.delegate?.callback(result: String(self.application.getBadge()))
    }
    
    // MARK: Registration Methods
    public func registerDevice() async {
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        
        do {
            let authorized = try await self.notificationManager.requestAuthorization(options: authOptions)
            if authorized {
                let topic = self.firebaseManager?.getGeneralTopic() ?? ""
                try await self.subscribe(topic)
            } else {
                throw FirebaseMessagingErrors.notificationsPermissionsDeniedError
            }
        } catch let error as FirebaseMessagingErrors {
            let errorToThrow = error == .requestPermissionsError ? .registrationPermissionsError : error
            self.delegate?.callbackError(error: errorToThrow)
        } catch {
            self.delegate?.callbackError(error: .registrationError)
        }
    }
    
    public func unregisterDevice() async {
        do {
            _ = try await self.firebaseManager?.deleteToken()
        } catch {
            self.delegate?.callbackError(error: .unregistrationDeleteTokenError)
            return
        }
        
        let topic = self.firebaseManager?.getGeneralTopic() ?? ""
        do {
            _ = try await self.firebaseManager?.unsubscribe(fromTopic: topic)
        } catch {
            self.delegate?.callbackError(error: .unregistrationError)
            return
        }
        
        self.delegate?.callbackSuccess()
    }
    
}
