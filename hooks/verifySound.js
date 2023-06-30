"use strict";

var path = require("path");
var utils = require("./utilities");

var constants = {
  soundZipFile: "sounds.zip"
};

module.exports = function(context) {
  var cordovaAbove8 = utils.isCordovaAbove(context, 8);
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

  var sourcePath = platformConfig.getSoundSourceFolder();
  var wwwFolder = platformConfig.wwwFolder;
  
  var soundZipFile = path.join(sourcePath, constants.soundZipFile);

  if(!utils.checkIfFileOrFolderExists(soundZipFile)){
    console.log("sounds.zip not found at platform/[ios/android]/wwww. Checking root/www")
    soundZipFile = path.join(wwwFolder, constants.soundZipFile);
    if(utils.checkIfFileOrFolderExists(soundZipFile)){
      //creating platforms/[ios/android]/wwww
      var destFilePath = path.join(sourcePath, constants.soundZipFile);
      if(!utils.checkIfFileOrFolderExists(sourcePath)) {
        utils.createOrCheckIfFolderExists(sourcePath);
      }

        utils.copyFromSourceToDestPath(defer, soundZipFile, destFilePath);
    } else {
      console.log("No sounds.zip file found. Procceding without it.")
      return
    }
  }

}
