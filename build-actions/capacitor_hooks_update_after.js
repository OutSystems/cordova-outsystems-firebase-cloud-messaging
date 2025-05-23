const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const platform = process.env.CAPACITOR_PLATFORM_NAME;
console.log("\tCloud Messaging plugin - running hook after update - for " + platform);
const projectDirPath = process.env.CAPACITOR_ROOT_DIR;
const webDirPath = process.env.CAPACITOR_WEB_DIR;

if (platform == 'android') {
    fixAndroidKaptGradleCapacitor();
    const androidResDir = path.resolve(projectDirPath, 'android', 'app', 'src', 'main', 'res', 'raw');
    copySounds(androidResDir, webDirPath, platform);
} else if (platform == 'ios') {
    const iosResDir = path.resolve(projectDirPath, 'ios', 'App', 'App', 'public');
    const iosAppDelegateDir = path.resolve(projectDirPath, 'ios', 'App', 'App', 'AppDelegate.swift');
    copySounds(iosResDir, webDirPath, platform);
    updateAppDelegate(iosAppDelegateDir);
}

function fixAndroidKaptGradleCapacitor() {
    const gradleFilePath = path.resolve(projectDirPath, 'android/app/build.gradle'); // change this path
    const kaptPluginLong = 'org.jetbrains.kotlin.kapt';
    const kaptPluginShort = 'kotlin-kapt';
    const linesToPrepend = `
// region Kapt Plugin
// The lines inside this region were added via the Firebase Cloud Messaging Plugin to ensure kapt works in a Capacitor app.
apply plugin: 'kotlin-android'
apply plugin: 'kotlin-kapt'
// endregion
`.trimStart();

    let gradleContent = fs.readFileSync(gradleFilePath, 'utf8');

    if (gradleContent.includes(kaptPluginLong) || gradleContent.includes(kaptPluginShort)) {
        console.log('\t[SKIPPED] Kotlin Gradle plugin already defined. Skipping update.');
    } else {
        const updatedContent = `${linesToPrepend}\n${gradleContent}`;
        fs.writeFileSync(gradleFilePath, updatedContent, 'utf8');
        console.log('\t[SUCCESS] Prepended Kotlin Kapt plugin to build.gradle');
    }
}

function copySounds(nativeResourceDirectory, zipDirectory, platform) {
    let zipFilePath = path.resolve(zipDirectory, 'sounds.zip');
    if (!fs.existsSync(zipFilePath)) {
        // in some contexts (like ODC), a hash may be appended to the file name
        //  so we'll try searching for a sounds*.zip file
        const foundZipFile = fs.readdirSync(zipDirectory).find(f => f.toLowerCase().startsWith('sounds') && f.toLowerCase().endsWith('.zip'));
        if (!foundZipFile) {
            console.error('\t[SKIPPED] sounds.zip does not seem to exist. Skipping this action');
            return
        }
        zipFilePath = path.resolve(zipDirectory, foundZipFile);
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sounds-'));
    // Extract zip file to temporary directory (deleted at the end of the function)
    try {
        execSync(`unzip -qq "${zipFilePath}" -d "${tmpDir}"`);
    } catch (err) {
        console.error('\t[ERROR] Failed to unzip file:', err.message);
        process.exit(1);
    }

    const wavFiles = fs.readdirSync(tmpDir).filter(f => f.toLowerCase().endsWith('.wav'));
    if (wavFiles.length === 0) {
        console.warn('\t[SKIPPED] No .wav files found in zip, finishing.');
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return
    }

    // Create target directories if needed
    if (!fs.existsSync(nativeResourceDirectory)) {
        fs.mkdirSync(nativeResourceDirectory, { recursive: true });
    }

    wavFiles.forEach(file => {
        const src = path.join(tmpDir, file);
        const dest = path.join(nativeResourceDirectory, file);
        fs.copyFileSync(src, dest);
        console.log(`\t[SUCCESS] Copied ${file} to ${platform} resources.`);
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log('\t[FINISH] Temporary files cleaned up.');
}

function updateAppDelegate(filePath) {

    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(filePath)) {
        console.error('\t[ERROR] AppDelegate.swift file was not found at:', filePath);
        process.exit(1);
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Add imports if missing
    if (!content.includes('import FirebaseCore')) {
        content = content.replace('import Capacitor', 'import Capacitor\nimport FirebaseCore');
    }
    if (!content.includes('import OSFirebaseMessagingLib')) {
        content = content.replace('import FirebaseCore', 'import FirebaseCore\nimport OSFirebaseMessagingLib');
    }

    // Inject FirebaseMessagingApplicationDelegate call into didFinishLaunchingWithOptions if not present
    content = content.replace(
        /(func application\(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: \[UIApplication\.LaunchOptionsKey: Any\]\?\) -> Bool \{)([\s\S]*?)(\n\s*return\s+true)/,
        (match, start, middle, end) => {
        if (middle.includes("FirebaseMessagingApplicationDelegate.shared.application")) {
            return match; // Already injected
        }
        return `${start}${middle}\n        FirebaseMessagingApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)${end}`;
        }
    );

    // Add the FirebaseMessagingApplicationDelegate for Firebase methods and fixSoundPath if not already present
    if (!content.includes('func application(_ application: UIApplication, didReceiveRemoteNotification')) {
        const insertion = `

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        // sounds from OutSystems capacitor builds go to a specific directory, we should ensure the sound path is correct
        let updatedUserInfo = fixSoundPath(userInfo)
        FirebaseMessagingApplicationDelegate.shared.application(application, didReceiveRemoteNotification: updatedUserInfo, fetchCompletionHandler: completionHandler)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        FirebaseMessagingApplicationDelegate.shared.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
    }

    private func fixSoundPath(_ userInfo: [AnyHashable : Any]) -> [AnyHashable : Any] {
        guard var newInfo = userInfo as? [String: Any],
              let notificationString = newInfo["notification"] as? String,
              let notificationData = notificationString.data(using: .utf8),
              var notificationDict = try? JSONSerialization.jsonObject(with: notificationData) as? [String: Any],
              let sound = notificationDict["sound"] as? String,
              !sound.hasPrefix("public/") else {
            return userInfo
        }
        notificationDict["sound"] = "public/\(sound)"
        if let updatedData = try? JSONSerialization.data(withJSONObject: notificationDict, options: []),
           let updatedString = String(data: updatedData, encoding: .utf8) {
            newInfo["notification"] = updatedString
        } else {
            return userInfo
        }
        return newInfo
    }
`;
        // Add before last closing brace of the class
        content = content.replace(/\n\}/, `${insertion}\n}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('\t[SUCCESS] AppDelegate.swift updated successfully.');

}