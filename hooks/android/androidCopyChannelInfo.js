const path = require('path');
const fs = require('fs');
const { DOMParser, XMLSerializer } = require('xmldom');
const { ConfigParser } = require('cordova-common');

module.exports = function (context) {
    // get notification channel name and description from config.xml file
    var projectRoot = context.opts.cordova.project ? context.opts.cordova.project.root : context.opts.projectRoot;
    var configXML = path.join(projectRoot, 'config.xml');
    var configParser = new ConfigParser(configXML);
    var channelName = configParser.getPlatformPreference("NotificationChannelDefaultName", "android");
    var channelDescription = configParser.getPlatformPreference("NotificationChannelDefaultDescription", "android");

    // load strings.xml using DOMParser
    var stringsXmlPath = path.join(projectRoot, 'platforms/android/app/src/main/res/values/strings.xml');
    var stringsXmlContents = fs.readFileSync(stringsXmlPath, 'utf-8').toString();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(stringsXmlContents, "application/xml");

    // set strings to replace (channelName and channelDesciption from config.xml)
    const replacements = {
        notification_channel_name: channelName,
        notification_channel_description: channelDescription,
    };

    // remove duplicates for each key
    // this is necessary for builds where the hook runs more than once, to avoid duplicate <string> entries
    const allStrings = Array.from(xmlDoc.getElementsByTagName('string'));
    for (const name of Object.keys(replacements)) {
        allStrings
            .filter(el => el.getAttribute('name') === name)
            .forEach(el => el.parentNode.removeChild(el));
    }

    // add new <string> elements for channelName and channelDescription, using replacements object
    for (const [name, value] of Object.entries(replacements)) {
        const newString = xmlDoc.createElement('string');
        newString.setAttribute('name', name);
        newString.appendChild(xmlDoc.createTextNode(value));
        xmlDoc.documentElement.appendChild(newString);
    }

    // write back to strings.xml file
    const serializer = new XMLSerializer();
    const updatedXmlString = serializer.serializeToString(xmlDoc);
    fs.writeFileSync(stringsXmlPath, updatedXmlString);
};
