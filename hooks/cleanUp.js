"use strict";

var path = require("path");
var utils = require("./utilities");

var constants = {
  soundFolder: "/sounds"
};

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
  var soundFolderPath = path.join(sourcePath, constants.soundFolder);

  if(utils.checkIfFileOrFolderExists(soundFolderPath)){
    utils.removeFolder(soundFolderPath);
  } 

}
