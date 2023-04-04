"use strict";

var path = require("path");
var utils = require("./utilities");

module.exports = function(context) {
  var cordovaAbove8 = utils.isCordovaAbove(context, 8);
  var cordovaAbove7 = utils.isCordovaAbove(context, 7);
  var defer;
  if (cordovaAbove8) {
    defer = require("q").defer();
  } else {
    defer = context.requireCordovaModule("q").defer();
  }
  
  var platform = context.opts.plugin.platform;
  var platformConfig = utils.getPlatformConfigs(platform);
  if (!platformConfig) {
    utils.handleError("Invalid platform", defer);
  }

  var sourceFolderPath = platformConfig.getSoundSourceFolder()
  var destFolderPath = platformConfig.getSoundDestinationFolder()

  console.log("sourceFolderPath: " + sourceFolderPath);
  console.log("destFolderPath: " + destFolderPath);

  var files = utils.getFilesFromPath(sourceFolderPath);
  if (!files) {
    utils.handleError("No directory found", defer);
  }

  console.log("passou getFilesFromPath()");

  var fileName = files.find(function (name) {
    console.log("name: " + name);
    console.log("soundFileExtension: " + platformConfig.soundFileExtension);
    return name.endsWith(platformConfig.soundFileExtension);
  });
  if (!fileName) {
    utils.handleError("No file found", defer);
  }

  console.log("passou files.find()");

  /*

  if(!utils.checkIfFolderExists(destFilePath)){
    utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePath);
  }

  if (cordovaAbove7) {
    var destPath = path.join(context.opts.projectRoot, "platforms", platform, "app");
    if (utils.checkIfFolderExists(destPath)) {
      var destFilePath = path.join(destPath, fileName);
      if(!utils.checkIfFolderExists(destFilePath)){
        utils.copyFromSourceToDestPath(defer, sourceFilePath, destFilePath);
      }
    }
  }
  */
      
  return defer.promise;
}
