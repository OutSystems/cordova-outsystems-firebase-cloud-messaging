"use strict";

var path = require("path");
var utils = require("./utilities");

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

  var sourceFolderPath = platformConfig.getSoundSourceFolder()
  var destFolderPath = platformConfig.getSoundDestinationFolder()

  if(!utils.checkIfFolderExists(destFolderPath)) {
    utils.createOrCheckIfFolderExists(destFolderPath)
  }

  var files = utils.getFilesFromPath(sourceFolderPath);
  if (!files) {
    utils.handleError("No directory found", defer);
  }
  else {
    var filteredFiles = files.filter(function(file){
      return file.endsWith(platformConfig.soundFileExtension) == true;
    });
  
    filteredFiles.forEach(function (f) {
      var filePath = path.join(sourceFolderPath, f);
      var destFilePath = path.join(destFolderPath, f);
      utils.copyFromSourceToDestPath(defer, filePath, destFilePath);
    });
  }
      
  return defer.promise;
}
