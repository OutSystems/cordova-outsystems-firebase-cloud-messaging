const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const platform = process.env.CAPACITOR_PLATFORM_NAME;
console.log("\tCloud Messaging plugin - running hook after update - for " + platform);
const projectDirPath = process.env.CAPACITOR_ROOT_DIR;
const webDirPath = process.env.CAPACITOR_WEB_DIR;

if (platform == 'android') {
    const androidResDir = path.resolve(projectDirPath, 'android', 'app', 'src', 'main', 'res', 'raw');
    copySounds(androidResDir, webDirPath, platform);
} else if (platform == 'ios') {
    // TODO confirm this works for iOS
    const iosResDir = path.resolve(projectDirPath, 'ios', 'dist');
    copySounds(iosResDir, webDirPath, platform);
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