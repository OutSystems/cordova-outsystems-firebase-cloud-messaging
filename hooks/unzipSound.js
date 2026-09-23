"use strict";

let path = require("path");
let utils = require("./utilities");
let AdmZip = require("adm-zip");

let constants = {
  soundZipFile: "sounds.zip"
};

function copyWavFiles(platformConfig, source, dest) {
  let files = utils.getFilesFromPath(source);

  let filteredFiles = files.filter(function(file){
    return file.endsWith(platformConfig.soundFileExtension);
  });

  console.log(`FCM_LOG: Found ${filteredFiles.length} sound files!`);
  return copyFiles(filteredFiles, source, dest)
}

function copyFiles(files, source, dest){
  if(!files){
    throw new Error (`OUTSYSTEMS_PLUGIN_ERROR: Something went wrong when trying to unzip sounds.zip - no files were found`);
  }

  if(!utils.checkIfFileOrFolderExists(dest)) {
    utils.createOrCheckIfFolderExists(dest);
  }
  let promiseArray = []
  for(const element of files) {
    let filePath = path.join(source, element);
    let destFilePath = path.join(dest, element);
    console.log(`FCM_LOG: Copying [${filePath}] to [${destFilePath}]`);

    promiseArray.push(utils.copyFromSourceToDestPath(filePath, destFilePath));
  }

  return promiseArray;
}

module.exports = function(context) {
  let platform = context.opts.platforms[0];
  let platformConfig = utils.getPlatformConfigs(platform);
  if (!platformConfig) {
    throw new Error (`OUTSYSTEMS_PLUGIN_ERROR: Error occurred on ${context.hook} because there was a problem detecting the platform configuration.`)
  }

  let sourcePath = utils.getPlatformSoundPath(context, platformConfig)
  let soundFolderPath = platformConfig.getSoundDestinationFolder();
  soundFolderPath = path.join(context.opts.projectRoot, soundFolderPath);

  let zipFile = utils.getFileName(sourcePath, "sounds", ".zip");
  
  let promises = [];
  
  if(zipFile != ""){
    let soundZipFilePath = path.join(sourcePath, zipFile);
    let zip = new AdmZip(soundZipFilePath);
    let zipFolder = sourcePath + "/sounds"
    zip.extractAllTo(zipFolder, true);
    
    let entriesNr = zip.getEntries().length;
    console.log(`FCM_LOG: Sound zip file has ${entriesNr} entries`);
    if(entriesNr == 0) {
      throw new Error (`OUTSYSTEMS_PLUGIN_ERROR: Sound zip file is empty, either delete it or add one or more files.`)
    }
    
   promises = copyWavFiles(platformConfig, zipFolder, soundFolderPath)

  }
  return Promise.all(promises);
}
