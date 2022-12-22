#import "AppDelegate+OSFirebaseCloudMessaging.h"
#import "OutSystems-Swift.h"
#import <objc/runtime.h>
#import <OSFirebaseMessagingLib/OSFirebaseMessagingLib-Swift.h>

@implementation AppDelegate (OSFirebaseCloudMessaging)

+ (void)load {
    Method original = class_getInstanceMethod(self, @selector(application:didFinishLaunchingWithOptions:));
    Method swizzled = class_getInstanceMethod(self, @selector(application:firebaseCloudMessagingPluginDidFinishLaunchingWithOptions:));
    method_exchangeImplementations(original, swizzled);
    
    original = class_getInstanceMethod(self, @selector(application:didReceiveRemoteNotification:fetchCompletionHandler:));
    swizzled = class_getInstanceMethod(self, @selector(application:firebaseCloudMessagingDidReceiveRemoteNotification:fetchCompletionHandler:));
    method_exchangeImplementations(original, swizzled);
    
    original = class_getInstanceMethod(self, @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:));
    swizzled = class_getInstanceMethod(self, @selector(application:firebaseCloudMessagingdidRegisterForRemoteNotificationsWithDeviceToken:));
    method_exchangeImplementations(original, swizzled);
}

- (BOOL)application:(UIApplication *)application firebaseCloudMessagingPluginDidFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    [self application:application firebaseCloudMessagingPluginDidFinishLaunchingWithOptions:launchOptions];    

    (void)[FirebaseMessagingApplicationDelegate.shared application:application didFinishLaunchingWithOptions:launchOptions];
    
    return YES;
}

- (void)application:(UIApplication *)application firebaseCloudMessagingDidReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
    [self application:application firebaseCloudMessagingDidReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
    
    (void)[FirebaseMessagingApplicationDelegate.shared application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

- (void)application:(UIApplication *)application firebaseCloudMessagingdidRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    [self application:application firebaseCloudMessagingdidRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
    
    (void)[FirebaseMessagingApplicationDelegate.shared application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

@end
