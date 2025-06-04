const path = require('path');
const fs = require('fs');
const et = require('elementtree');
const { DOMParser, XMLSerializer } = require('xmldom');
const { ConfigParser } = require('cordova-common');

module.exports = function (context) {
    var projectRoot = context.opts.cordova.project ? context.opts.cordova.project.root : context.opts.projectRoot;
    var configXML = path.join(projectRoot, 'config.xml');
    var configParser = new ConfigParser(configXML);
    var channelName = configParser.getPlatformPreference("NotificationChannelDefaultName", "android");
    var channelDescription = configParser.getPlatformPreference("NotificationChannelDefaultDescription", "android");

    var stringsXmlPath = path.join(projectRoot, 'platforms/android/app/src/main/res/values/strings.xml');
    var stringsXmlContents = fs.readFileSync(stringsXmlPath).toString();
    var etreeStrings = et.parse(stringsXmlContents);

    /*
    var dataTags = etreeStrings.findall('./string[@name="notification_channel_name"]');
    for (var i = 0; i < dataTags.length; i++) {
        var data = dataTags[i];
        data.text = channelName;
    }

    var dataTagsSecond = etreeStrings.findall('./string[@name="notification_channel_description"]');
    for (var i = 0; i < dataTagsSecond.length; i++) {
        var data = dataTagsSecond[i];
        data.text = channelDescription;
    }

    var resultXmlStrings = etreeStrings.write();
    fs.writeFileSync(stringsXmlPath, resultXmlStrings);

    */

    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(stringsXmlContents, "application/xml");

    // Remove all existing strings with the same name
    const strings = xmlDoc.getElementsByTagName("string");
    const toRemove = [];

    for (let i = 0; i < strings.length; i++) {
        if (strings[i].getAttribute("name") === "notification_channel_name") {
            toRemove.push(strings[i]);
    }
    }
    toRemove.forEach(el => el.parentNode.removeChild(el));

    // Create and append the new string
    const newString = xmlDoc.createElement("string");
    newString.setAttribute("name", notification_channel_name);
    newString.textContent = channelName;
    xmlDoc.documentElement.appendChild(newString);

    // Serialize back to string
    const serializer = new XMLSerializer();
    const updatedXmlString = serializer.serializeToString(xmlDoc);
    
    // Write it back to the file
    fs.writeFileSync(stringsXmlPath, updatedXmlString);
};
