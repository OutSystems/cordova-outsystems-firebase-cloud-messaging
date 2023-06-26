"use strict"

var path = require("path");
var fs = require("fs");

var constants = {
  platforms: "platforms",
  android: {
    platform: "android",
    wwwFolder: "assets/www",
    soundFileExtension: ".wav",
    getSoundDestinationFolder: function() {
      return "platforms/android/app/src/main/res/raw";
    },
    getSoundSourceFolder: function() {
      return "www";
    }
  },
  ios: {
    platform: "ios",
    wwwFolder: "www",
    soundFileExtension: ".wav",
    getSoundDestinationFolder: function() {
      return "www";
    },
    getSoundSourceFolder: function() {
      return "www";
    }
  }
};

function handleError(errorMessage, defer) {
  console.log(errorMessage);
  defer.reject();
}


function checkIfFileOrFolderExists(path) {
  return fs.existsSync(path);
}

function removeFile(path){
  fs.unlinkSync(path)
}

function removeFolder(path){
  fs.rmdirSync(path)
}

function getFilesFromPath(path) {
  return fs.readdirSync(path);
}

function createOrCheckIfFolderExists(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

function getPlatformConfigs(platform) {
  if (platform === constants.android.platform) {
    return constants.android;
  } else if (platform === constants.ios.platform) {
    return constants.ios;
  }
}

function isCordovaAbove(context, version) {
  let cordovaVersion = context.opts.cordova.version;
  let sp = cordovaVersion.split('.');
  return parseInt(sp[0]) >= version;
}


function copyFromSourceToDestPath(defer, sourcePath, destPath) {
  fs.createReadStream(sourcePath).pipe(fs.createWriteStream(destPath))
  .on("close", function (err) {
    defer.resolve();
  })
  .on("error", function (err) {
    console.log(err);
    defer.reject();
  });
}

function isAndroid(platform){
  return platform === constants.android.platform
}

module.exports = {
  isCordovaAbove,
  handleError,
  getPlatformConfigs,
  copyFromSourceToDestPath,
  getFilesFromPath,
  createOrCheckIfFolderExists,
  checkIfFileOrFolderExists,
  removeFile,
  removeFolder,
  isAndroid
};