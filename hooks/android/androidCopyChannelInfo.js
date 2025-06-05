const path = require('path');
const fs = require('fs');
//const et = require('elementtree');
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
    
    //var etreeStrings = et.parse(stringsXmlContents);

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

    // Define target strings and their new values
    const replacements = {
        notification_channel_name: channelName,
        notification_channel_description: channelDescription,
    };

    // Remove duplicates for each key
    const allStrings = Array.from(xmlDoc.getElementsByTagName('string'));
    for (const name of Object.keys(replacements)) {
        allStrings
            .filter(el => el.getAttribute('name') === name)
            .forEach(el => el.parentNode.removeChild(el));
    }

    // Add new <string> elements
    for (const [name, value] of Object.entries(replacements)) {
        const newString = xmlDoc.createElement('string');
        newString.setAttribute('name', name);
        newString.appendChild(xmlDoc.createTextNode(value));
        xmlDoc.documentElement.appendChild(newString);
    }

    // Serialize back to string
    const serializer = new XMLSerializer();
    const updatedXmlString = serializer.serializeToString(xmlDoc);
    
    // Write it back to the file
    fs.writeFileSync(stringsXmlPath, updatedXmlString);
};
