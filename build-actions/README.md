
# Build Actions

This folder contains a .yaml file for configuring build actions to use in a plugin on ODC with Capacitor. The purpose of these build actions is to provide the same functionality as cordova hooks, but on a Capacitor shell.

## Contents

The file [updateCloudMessagingConfigs.yaml](./updateCloudMessagingConfigs.yaml) contains ????????????????????? build actions:

1. Android specific. 


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