const vscode = require("vscode");
const _ = require("lodash");
const { save } = require("./save");
const monitor = require("node-active-window");

let activeWin = {};
let notInCode = false;
let codeWin = {};

const justHitEnter = (contentChanges) => !contentChanges.length || (contentChanges[0].text.trim() === "" && contentChanges[0].text !== "");

const debounceInMs = vscode.workspace.getConfiguration("cau-vscode-autosave").get("debounceMs");
const debounceInMsMinus150 = debounceInMs - 150;

setInterval(() => {
    monitor.getActiveWindow((err, window) => {
        if (!err && JSON.stringify(activeWin) !== JSON.stringify(window)) {
            activeWin = window;
            if (window.app == "Code" && JSON.stringify(codeWin) !== JSON.stringify(window)) {
                codeWin = window;
            }
        }
    });
}, debounceInMsMinus150);

let ifOnWindowChangeBool = false;

setInterval(() => {
    if (vscode.workspace.getConfiguration("cau-vscode-autosave").get("onWindowChanged") !== ifOnWindowChangeBool) {
        ifOnWindowChangeBool = vscode.workspace.getConfiguration("cau-vscode-autosave").get("onWindowChanged");
    }
}, debounceInMsMinus150);

const shouldSkipSave = (e) => {
    const { contentChanges, document } = e;
    if (document.isUntitled) return true;
    if (justHitEnter(contentChanges)) return true;
    if (hasErrors(document) && isRelevantError(document)) return true;
    return false;
};

const getLowestSeverity = (document) => {
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    const errorSeverities = diagnostics.map(({ severity }) => severity);
    errorSeverities.sort((a, b) => a - b);
    const [lowestSeverity] = errorSeverities;
    return lowestSeverity;
};

const isRelevantError = (document) => {
    const lowestSeverity = getLowestSeverity(document);
    return lowestSeverity < 2;
};

const hasErrors = (document) => {
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    return Boolean(diagnostics.length);
};

const handleDocumentEdit = (context, data = "[]") => {
    if (!data.startsWith("[")) {
        throw new TypeError("the parsed data is not a JSON'd array.");
    }

    let windowsBlacklistArray = JSON.parse(data);

    if (ifOnWindowChangeBool) {
        let listener = (winStateE) => {
            notInCode = !winStateE.focused;
            if (winStateE.focused == false) {
                _.debounce(async (e) => {
                    if (shouldSkipSave(e) || windowsBlacklistArray.indexOf(activeWin.app.toUpperCase()) !== -1) return;
                    await save(context, e.document);
                }, debounceInMs);
            }
        };

        vscode.window.onDidChangeWindowState(listener);
    } else {
        vscode.workspace.onDidChangeTextDocument(
            _.debounce(async (e) => {
                if (shouldSkipSave(e)) return;
                await save(context, e.document);
            }, debounceInMs)
        );
    }
};

module.exports = {
    handleDocumentEdit
};
