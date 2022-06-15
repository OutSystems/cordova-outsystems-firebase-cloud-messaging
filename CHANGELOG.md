# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The changes documented here do not include those from the original repository.

## [Unreleased]

## 15-06-2022
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
