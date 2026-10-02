#import <Foundation/Foundation.h>

// Nothing calls into this class directly - it only exists so the Objective-C runtime can activate
// its +load method (see UIApplication+OSFirebaseCloudMessaging.m). Static linkers (as used when this
// plugin is consumed as an SPM/CocoaPods module by Capacitor) can strip a whole object file if nothing
// outside it references any of its symbols. +activate exists purely so OSFirebaseCloudMessaging.swift's
// pluginInitialize() - which both Cordova and Capacitor are guaranteed to call - can force that
// reference, and with it, the +load-based swizzle in the same object file.
@interface OSFCMAppDelegateSwizzler : NSObject
+ (void)activate;
@end
