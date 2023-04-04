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

  if(!utils.checkIfFolderExists(destFolderPath)) {
    console.log("creating folder bc it does not exist yet.")
    utils.createOrCheckIfFolderExists(destFolderPath)
  }

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

  console.log("files: " + files);

  var filteredFiles = files.filter(function(file){
    return file.endsWith(platformConfig.soundFileExtension) == true;
  });

  console.log("filteredFiles: " + filteredFiles)

  //percorrer os filteredFiles e copiar para a destFolderPath
  filteredFiles.forEach(function (f) {
    console.log("currentFile: " + f);
    var filePath = path.join(sourceFolderPath, f);
    console.log("filePath: " + filePath);
    var destFilePath = path.join(destFolderPath, f);
    console.log("destFilePath: ", destFilePath)
    utils.copyFromSourceToDestPath(defer, filePath, destFilePath);
  });
      
  return defer.promise;
}
