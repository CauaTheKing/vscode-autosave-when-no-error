const vscode = require("vscode");
const { handleDocumentEdit } = require("./src/documentManager");
const { track, TRACKED_ACTIONS } = require("./src/tracker");
const fs = require("fs");
const path = require("path");

const configs = vscode.workspace.getConfiguration("cau-vscode-autosave");
const windowsBlacklistJSONFile = path.resolve(__dirname, "./windows_blacklist.json");

var globalContext = null;
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    let windowsBlacklistString = `${configs.get("windowsBlacklist")}`;

    windowsBlacklistString = windowsBlacklistString.toUpperCase();
    windowsBlacklistString = windowsBlacklistString.replaceAll('\\"', "§dbl_quot§");
    windowsBlacklistString = windowsBlacklistString.replaceAll('", ', '",');
    if (windowsBlacklistString.endsWith(",") && windowsBlacklistString !== '"CODE",') {
        windowsBlacklistString = windowsBlacklistString.substring(0, windowsBlacklistString.length - 1);
    }
    if (windowsBlacklistString.endsWith('"')) {
        windowsBlacklistString = windowsBlacklistString.substring(0, windowsBlacklistString.length - 1);
    }

    let windowsBlacklistArray = windowsBlacklistString.split('",');
    windowsBlacklistString = windowsBlacklistString.replaceAll('",', '", ');
    windowsBlacklistString = windowsBlacklistString.replaceAll("§dbl_quot§", '\\"');

    windowsBlacklistArray = JSON.parse(
        JSON.stringify(windowsBlacklistArray)
            .replaceAll('\\"', "")
            .replaceAll("§dbl_quot§", String("\\" + '"'))
    );

    try {
        fs.writeFile(windowsBlacklistJSONFile, JSON.stringify(windowsBlacklistArray, null, 4));
    } catch (error) {
        console.warn(error);
    }

    if (windowsBlacklistArray.length == 1 && (windowsBlacklistArray[0] === "CODE" || windowsBlacklistArray[0] === "VSCODE")) {
        windowsBlacklistString = '"CODE",';
    } else {
        windowsBlacklistString = windowsBlacklistString + '"';
    }

    await configs.update("windowsBlacklist", windowsBlacklistString, vscode.ConfigurationTarget.Global);

    globalContext = context;

    fs.readFile(windowsBlacklistJSONFile, "utf8", function (err, data) {
        if (err) {
            console.warn(err);
            return { "error": err }; // prettier-ignore
        }
        console.log(data);
        handleDocumentEdit(context, data);
    });

    track(context, TRACKED_ACTIONS.ACTIVATE, {
        at: new Date().toUTCString()
    });
}

// this method is called when your extension is deactivated
function deactivate() {
    track(globalContext, TRACKED_ACTIONS.DEACTIVATED);
}

module.exports = {
    activate,
    deactivate
};
