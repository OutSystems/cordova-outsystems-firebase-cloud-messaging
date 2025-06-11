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

    // get all <string> elements
    const allStrings = Array.from(xmlDoc.getElementsByTagName('string'));

    for (const [name, newValue] of Object.entries(replacements)) {

        // find all strings with the given name
        const matchingElements = allStrings.filter(el => el.getAttribute('name') === name);

        if (matchingElements.length > 0) {

            // if multiple found, remove all except the first
            for (let i = 1; i < matchingElements.length; i++) {
                matchingElements[i].parentNode.removeChild(matchingElements[i]);
            }

            const element = matchingElements[0];
            if (element.textContent !== newValue) {
                element.textContent = newValue;
            }
        } else {

            // Not found, so create and append new <string>
            const newString = xmlDoc.createElement('string');
            newString.setAttribute('name', name);
            newString.appendChild(xmlDoc.createTextNode(newValue));
            xmlDoc.documentElement.appendChild(newString);
        }
    }

    // write back to strings.xml file
    const serializer = new XMLSerializer();
    const updatedXmlString = serializer.serializeToString(xmlDoc);
    fs.writeFileSync(stringsXmlPath, updatedXmlString);
};
