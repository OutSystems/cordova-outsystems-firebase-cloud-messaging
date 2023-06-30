"use strict";

var path = require("path");
var utils = require("./utilities");
var AdmZip = require("adm-zip");

var constants = {
  soundZipFile: "sounds.zip"
};

function copyWavFiles(platformConfig, source, dest, defer) {
  var files = utils.getFilesFromPath(source);

  let filteredFiles = files.filter(function(file){
    return file.endsWith(platformConfig.soundFileExtension) == true;
  });
  
  console.log("Nr of sound files in zip: ", filteredFiles.length)
  copyFiles(filteredFiles, source, dest, defer)
}

function copyFiles(files, source, dest, defer){
  if(!files){
    utils.handleError("Something went wrong when trying to unzip sounds.zip, no files were found", defer);
    return
  }
  
  if(!utils.checkIfFileOrFolderExists(dest)) {
    utils.createOrCheckIfFolderExists(dest);
  }

  for(var i = 0; i < files.length; i++) {
    var filePath = path.join(source, files[i]);
    var destFilePath = path.join(dest, files[i]);
    utils.copyFromSourceToDestPath(defer, filePath, destFilePath);
  }
}

module.exports = function(context) {
  var cordovaAbove8 = utils.isCordovaAbove(context, 8);
  var defer;
  if (cordovaAbove8) {
    defer = require("q").defer();
  } else {
    defer = context.requireCordovaModule("q").defer();
  }
  
  var platform = context.opts.platforms[0];
  var platformConfig = utils.getPlatformConfigs(platform);
  if (!platformConfig) {
    utils.handleError("Invalid platform", defer);
  }

  var sourcePath = platformConfig.getSoundSourceFolder();
  var soundFolderPath = platformConfig.getSoundDestinationFolder();
  
  var soundZipFile = path.join(sourcePath, constants.soundZipFile);

  if(utils.checkIfFileOrFolderExists(soundZipFile)){
    var zip = new AdmZip(soundZipFile);
    zip.extractAllTo(sourcePath, true);
    
    var entriesNr = zip.getEntries().length;
    
    if(entriesNr == 0) {
      utils.handleError("Sound zip file is empty, either delete it or add one or more files", defer);
      return
    }

    var zipFolder = sourcePath + "/sounds"

    if(!utils.checkIfFileOrFolderExists(zipFolder)){
      if(utils.isAndroid(platform))
        copyWavFiles(platformConfig, sourcePath, soundFolderPath, defer)
    } else { 
      copyWavFiles(platformConfig, zipFolder, soundFolderPath, defer)  
    }
    
    utils.removeFile(soundZipFile);
  }

}
