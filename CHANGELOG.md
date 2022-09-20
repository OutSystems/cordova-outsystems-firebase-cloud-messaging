# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The changes documented here do not include those from the original repository.

## 20-09-2022
- Added permission request to receive notifications on Android API >= 33. (https://outsystemsrd.atlassian.net/browse/RMET-1709)

## [Version 1.0.2]

## 28-07-2022
- Renamed classes to avoid incompatibility. (https://outsystemsrd.atlassian.net/browse/RMET-1743)

## 26-07-2022
- Added dependency on external libs. Changed methods to sync. (https://outsystemsrd.atlassian.net/browse/RMET-1480)

## [Version 1.0.1]

## 29-06-2022
- Removed hook that adds swift support and added the plugin as dependency. (https://outsystemsrd.atlassian.net/browse/RMET-1680)

## [Version 1.0.0]

## 24-06-2022
- Update for multiple callback ids.

## 23-06-2022
- Update error codes and messages.

## 22-06-2022
- Include image in local notifications. (https://outsystemsrd.atlassian.net/browse/RMET-1676).

## 21-06-2022
- Allow default values for channel name and description (https://outsystemsrd.atlassian.net/browse/RMET-1612).

## 20-06-2022
- Process deep link received in Notification (https://outsystemsrd.atlassian.net/browse/RMET-1605).

## 15-06-2022
- Implements an event which is triggered when a notification is received.(https://outsystemsrd.atlassian.net/browse/RMET-1610)
- Receive and trigger a Dialog Notification (https://outsystemsrd.atlassian.net/browse/RMET-1609).

## 08-06-2022
- Save silent notification in DB when app is not on foreground - android (https://outsystemsrd.atlassian.net/browse/RMET-1604).
- Silent notifications to send event when app is on foreground - android (https://outsystemsrd.atlassian.net/browse/RMET-1595).

## 31-05-2022
- Added get pending notifications to both JS and bridge layers.

## 30-05-2022
- Added library with Room databse.
- Added library with CoreData databse.

## 02-06-2022
- Get Pending Notificaitons implemented (https://outsystemsrd.atlassian.net/browse/RMET-1596 ).
- Save Silent Notification in a database when the app is not opened (https://outsystemsrd.atlassian.net/browse/RMET-1603).
- Receive Silent Notification and Trigger Notify Event (https://outsystemsrd.atlassian.net/browse/RMET-1589).
- Implemented silent notification app on foreground event on Android (https://outsystemsrd.atlassian.net/browse/RMET-1540, https://outsystemsrd.atlassian.net/browse/

## 31-05-2022
- Added methods for event handling in JS layer (https://outsystemsrd.atlassian.net/browse/RMET-1595, https://outsystemsrd.atlassian.net/browse/RMET-1589)

## 27-05-2022
- Updated lib to contain GetToken and OnReceivedNotification.

## 24-05-2022
- Includes register and unregister for Android (https://outsystemsrd.atlassian.net/browse/RMET-1540, https://outsystemsrd.atlassian.net/browse/RMET-1541)

## 23-05-2022
- Includes channel info in sendLocalNotification for Android (https://outsystemsrd.atlassian.net/browse/RMET-1561)

## 20-05-2022
- Implements sendLocalNotification (that used to be setBadgeNumber)

## 18-05-2022
- Implements setBadge, getBadge and clearNotifications for Android (https://outsystemsrd.atlassian.net/browse/RMET-1561, https://outsystemsrd.atlassian.net/browse/RMET-1576, https://outsystemsrd.atlassian.net/browse/RMET-1557)
