const { handleDocumentEdit } = require("./src/documentManager");
const { track, TRACKED_ACTIONS } = require("./src/tracker");

var globalContext = null;
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  globalContext = context;
  handleDocumentEdit(context);
  track(context, TRACKED_ACTIONS.ACTIVATE, {
    at: new Date().toUTCString(),
  });
}

// this method is called when your extension is deactivated
function deactivate() {
  track(globalContext, TRACKED_ACTIONS.DEACTIVATED);
}

module.exports = {
  activate,
  deactivate,
};
