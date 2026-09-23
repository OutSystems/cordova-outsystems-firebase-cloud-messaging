#import <UIKit/UIKit.h>
#import <objc/runtime.h>
#import <OSFirebaseMessagingLib/OSFirebaseMessagingLib-Swift.h>
#import "OSFCMAppDelegateSwizzler.h"

// This plugin needs to react to UIApplicationDelegate callbacks (didFinishLaunchingWithOptions,
// didRegisterForRemoteNotificationsWithDeviceToken, didReceiveRemoteNotification), but the concrete
// AppDelegate class lives in the consuming app's own target/module, which this plugin cannot import:
//  - Cordova apps compile it as a plain Objective-C (or Swift, on Cordova iOS 8+) class in the app target.
//  - Capacitor apps compile this plugin as a separate Pod/SPM module with no header access to the app's
//    own AppDelegate.swift at all.
// So instead of declaring a category on a named "AppDelegate" class, we swizzle UIApplication's own
// setDelegate:, which the OS always calls at launch with whatever concrete object was assigned as the
// delegate (Cordova's, Capacitor's, or any future variant, including SwiftUI's @UIApplicationDelegateAdaptor,
// which still assigns the delegate through this same mechanism). From there we discover that class at
// runtime and inject the notification-related selectors onto it directly.

static BOOL OSFCMInjectSelector(Class newClass, SEL newSel, Class addToClass, SEL makeLikeSel) {
    Method newMeth = class_getInstanceMethod(newClass, newSel);
    IMP imp = method_getImplementation(newMeth);
    const char *typeEncoding = method_getTypeEncoding(newMeth);

    // Keep - class_getInstanceMethod for existing detection; class_addMethod succeeds even if
    // addToClass was already loaded once into the runtime.
    BOOL existing = class_getInstanceMethod(addToClass, makeLikeSel) != NULL;

    if (existing) {
        class_addMethod(addToClass, newSel, imp, typeEncoding);
        Method addedMeth = class_getInstanceMethod(addToClass, newSel);
        Method originalMeth = class_getInstanceMethod(addToClass, makeLikeSel);
        method_exchangeImplementations(originalMeth, addedMeth);
    } else {
        class_addMethod(addToClass, makeLikeSel, imp, typeEncoding);
    }

    return existing;
}

static NSDictionary *OSFCMFixSoundPath(NSDictionary *userInfo) {
    NSMutableDictionary *mutableUserInfo = [userInfo mutableCopy];

    id notificationValue = userInfo[@"notification"];
    if (![notificationValue isKindOfClass:[NSString class]]) {
        return userInfo;
    }

    NSData *notificationData = [(NSString *)notificationValue dataUsingEncoding:NSUTF8StringEncoding];
    if (!notificationData) {
        return userInfo;
    }

    NSError *jsonError = nil;
    NSMutableDictionary *notificationDict = [NSJSONSerialization JSONObjectWithData:notificationData options:NSJSONReadingMutableContainers error:&jsonError];
    if (![notificationDict isKindOfClass:[NSDictionary class]] || jsonError) {
        return userInfo;
    }

    // Cordova ships web assets under "www/", Capacitor under "public/".
    NSString *webAssetsFolder = NSClassFromString(@"Capacitor.CAPBridge") ? @"public/" : @"www/";

    NSString *sound = notificationDict[@"sound"];
    if ([sound isKindOfClass:[NSString class]] && ![sound hasPrefix:webAssetsFolder]) {
        notificationDict[@"sound"] = [webAssetsFolder stringByAppendingString:sound];

        NSData *updatedData = [NSJSONSerialization dataWithJSONObject:notificationDict options:0 error:&jsonError];
        if (updatedData && !jsonError) {
            NSString *updatedString = [[NSString alloc] initWithData:updatedData encoding:NSUTF8StringEncoding];
            if (updatedString) {
                mutableUserInfo[@"notification"] = updatedString;
                return [mutableUserInfo copy];
            }
        }
    }

    return userInfo;
}

// Holds the actual method bodies we inject onto the app's real AppDelegate class. Never
// instantiated as a delegate itself - we only ever borrow its compiled method implementations.
@implementation OSFCMAppDelegateSwizzler

+ (void)activate {}

- (BOOL)fcmApplication:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    if ([self respondsToSelector:@selector(fcmApplication:didFinishLaunchingWithOptions:)]) {
        [self fcmApplication:application didFinishLaunchingWithOptions:launchOptions];
    }

    (void)[FirebaseMessagingApplicationDelegate.shared application:application didFinishLaunchingWithOptions:launchOptions];

    return YES;
}

- (void)fcmApplication:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
    BOOL callsThrough = [self respondsToSelector:@selector(fcmApplication:didReceiveRemoteNotification:fetchCompletionHandler:)];
    NSDictionary *updatedUserInfo = OSFCMFixSoundPath(userInfo);

    // FirebaseMessagingApplicationDelegate always calls its completion handler exactly once. If another
    // implementation is chained below, let it own the real completion handler instead so iOS doesn't see
    // it invoked twice - the OS crashes if a fetch completion handler is called more than once.
    void (^fcmCompletionHandler)(UIBackgroundFetchResult) = callsThrough ? ^(UIBackgroundFetchResult result) {} : completionHandler;

    (void)[FirebaseMessagingApplicationDelegate.shared application:application
                                       didReceiveRemoteNotification:updatedUserInfo
                                             fetchCompletionHandler:fcmCompletionHandler];

    if (callsThrough) {
        [self fcmApplication:application didReceiveRemoteNotification:updatedUserInfo fetchCompletionHandler:completionHandler];
    }
}

- (void)fcmApplication:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    (void)[FirebaseMessagingApplicationDelegate.shared application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];

    if ([self respondsToSelector:@selector(fcmApplication:didRegisterForRemoteNotificationsWithDeviceToken:)]) {
        [self fcmApplication:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
    }
}

@end

@implementation UIApplication (OSFirebaseCloudMessaging)

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];
        SEL originalSelector = @selector(setDelegate:);
        SEL swizzledSelector = @selector(fcm_setDelegate:);
        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
        method_exchangeImplementations(originalMethod, swizzledMethod);
    });
}

- (void)fcm_setDelegate:(id<UIApplicationDelegate>)delegate {
    // Due to the swap above, this call actually invokes the original setDelegate: implementation.
    [self fcm_setDelegate:delegate];

    static dispatch_once_t injectOnceToken;
    dispatch_once(&injectOnceToken, ^{
        if (!delegate) {
            return;
        }

        Class delegateClass = [delegate class];
        Class helperClass = [OSFCMAppDelegateSwizzler class];

        OSFCMInjectSelector(helperClass, @selector(fcmApplication:didFinishLaunchingWithOptions:),
                            delegateClass, @selector(application:didFinishLaunchingWithOptions:));
        OSFCMInjectSelector(helperClass, @selector(fcmApplication:didReceiveRemoteNotification:fetchCompletionHandler:),
                            delegateClass, @selector(application:didReceiveRemoteNotification:fetchCompletionHandler:));
        OSFCMInjectSelector(helperClass, @selector(fcmApplication:didRegisterForRemoteNotificationsWithDeviceToken:),
                            delegateClass, @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:));
    });
}

@end
