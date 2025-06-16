
# Build Actions

This folder contains a .yaml file for configuring build actions to use in a plugin on ODC with Capacitor. The purpose of these build actions is to provide the same functionality as cordova hooks, but on a Capacitor shell.

## Contents

The file [updateCloudMessagingConfigs.yaml](./updateCloudMessagingConfigs.yaml) contains 3 build actions:

1. Android specific. Set the notification channel name in `strings.xml`.
2. iOS specific. Updates the entitlements file to include `aps-environment`.
3. iOS specific. Adds `remote-notification` to `UIBackgroundModes` in `Info.plist`.

We also have a [exampleBuildActionsIOSApp.yaml], that allows to set `LSApplicationQueriesSchemes` for custom url schemes. This one isn't used by the OutSystems Plugin, but can be set by apps that use the plugin.

Furthermore, there are changes that can't be accomplished with build actions, and we used [Capacitor hooks](https://capacitorjs.com/docs/cli/hooks) for this. We have two JavaScript files for hooks:

- `capacitor_hooks_update_after.js` -> Copies the custom audio files inside `sounds.zip` to the application-specific directory. For iOS, adds code to the `AppDelegate.swift` to integrate with the FCM iOS native library. This is needed because while the cordova Plugin has code for this, it does not get invoked in a Capacitor App because the code is added a Pod, instead of in the app directly. Also fr iOS, sets `handleApplicationNotifications` to false for the `capacitor.config.json` file, to allow custom handling of Push notifications (e.g. silent notifications) in a capacitor app, and also to make sure notifications are sent when the app is open. For Android, adds kapt plugin to app's `build.gradle` (without this, all builds would fail), and the Azure repo (where the camera native library currently is) to the root `build.gradle` (with this, release builds would fail).


## Outsystems' Usage

1. Copy the build action yaml file (which can contain multiple build actions inside) into the ODC Plugin, placing them in "Data" -> "Resources" and set "Deploy Action" to "Deploy to Target Directory", with target directory empty.
2. Update the Plugin's Extensibility configuration to use the build action.

```json
{
    "buildConfigurations": {
        "buildAction": {
            "config": $resources.buildActionFileName.yaml,
            "parameters": {
                // parameters go here; if there are no parameters then the block can be ommited
            }
        }
    }
}
```