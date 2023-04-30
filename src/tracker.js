const { version } = require("../package.json");
const TelemetryReporter = require("@vscode/extension-telemetry").default;

const TRACKED_ACTIONS = {
  AUTOSAVED: "AUTOSAVED",
  ACTIVATE: "activate",
  DEACTIVATED: "DEACTIVATED",
  NOTIFIED: "NOTIFIED",
  SILENCED_PROGRESS: "SILENCED_PROGRESS",
  REVIEW_CLICK: "REVIEW_CLICK",
};

const initializeTracker = (context) => {
  const extensionId = "vscode-autosave";
  const extensionVersion = version;
  const key = "1961a905-2d4f-46aa-9261-8979f3c65565";
  //process.env.INSIGHTS_KEY;
  var reporter = new TelemetryReporter(extensionId, extensionVersion, key);
  context.subscriptions.push(reporter);
  return reporter;
};

const track = (context, key, props, values) => {
  const reporter = initializeTracker(context);
  reporter.sendTelemetryEvent(key, props, values);
};

module.exports = {
  track,
  TRACKED_ACTIONS,
};
