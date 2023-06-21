"use strict";

var path = require("path");
var utils = require("./utilities");
var AdmZip = require("adm-zip");
var fs = require('fs');

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

  var sourcePath = platformConfig.getSoundSourceFolder()
  var soundFolderPath = platformConfig.getSoundDestinationFolder()
  
  var soundZipFile = path.join(sourcePath, constants.soundZipFile)
  if(fs.existsSync(soundZipFile)){
    var zip = new AdmZip(soundZipFile);
    zip.extractAllTo(sourcePath, true);
    

    var zipFolder = sourcePath + "/sounds"
    if(!utils.checkIfFolderExists(zipFolder)){
      utils.handleError("Something went wrong when trying to unzip sounds.zip", defer);
      return
    }
    var files = utils.getFilesFromPath(zipFolder);

    if(!files){
      utils.handleError("Something went wrong when trying to unzip sounds.zip", defer);
      return
    } 
    
    if(!utils.checkIfFolderExists(soundFolderPath)) {
      utils.createOrCheckIfFolderExists(soundFolderPath)
    }

    for(var i = 0; i < files.length; i++) {
      var filePath = path.join(zipFolder, files[i]);
      var destFilePath = path.join(soundFolderPath, files[i]);
      utils.copyFromSourceToDestPath(defer, filePath, destFilePath);
    }

    fs.unlinkSync(soundZipFile)
  }

  

}
