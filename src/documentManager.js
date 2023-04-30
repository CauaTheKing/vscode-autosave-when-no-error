const vscode = require("vscode");
const _ = require("lodash");
const { save } = require("./save");

const justHitEnter = (contentChanges) =>
  !contentChanges.length ||
  (contentChanges[0].text.trim() === "" && contentChanges[0].text !== "");

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

const handleDocumentEdit = (context) => {
  const debounceInMs = vscode.workspace
    .getConfiguration("vscode-autosave")
    .get("debounceMs");

  vscode.workspace.onDidChangeTextDocument(
    _.debounce(async (e) => {
      if (shouldSkipSave(e)) return;
      await save(context, e.document);
    }, debounceInMs)
  );
};

module.exports = {
  handleDocumentEdit,
};
