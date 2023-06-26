"use strict";

var path = require("path");
var utils = require("./utilities");

var constants = {
  soundFolder: "/sounds"
};

module.exports = function(context) {
  var platform = context.opts.plugin.platform;
  var platformConfig = utils.getPlatformConfigs(platform);
  if (!platformConfig) {
    utils.handleError("Invalid platform", defer);
  }

  var sourcePath = platformConfig.getSoundSourceFolder();
  var soundFolderPath = path.join(sourcePath, constants.soundFolder);

  if(utils.checkIfFileOrFolderExists(soundFolderPath)){
    utils.removeFolder(soundFolderPath);
  } 

}
