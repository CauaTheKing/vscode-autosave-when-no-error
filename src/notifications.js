const vscode = require("vscode");
const { stateKeys } = require("./store");
const { track, TRACKED_ACTIONS } = require("./tracker");

const messages = [
  "You just saved {MINUTES} {MINUTES_LABEL} by using VSCode AutoSave.\n\nCongrats!",
  "Good news!\n\nVSCode AutoSave saved you {MINUTES} {MINUTES_LABEL}.",
  "Congrats!\n\nYou've saved {MINUTES} {MINUTES_LABEL} by using VSCode AutoSave.\n\nKeep up the good work!",
  "You saved {MINUTES} {MINUTES_LABEL} by using VSCode AutoSave.\n\nThat's pretty amazing, right?",
];

const messageMinute = (minutes) => {
  const label = minutes > 1 ? "minutes" : "minute";
  const message = messages[Math.floor(Math.random() * messages.length)];
  return message
    .replace("{MINUTES}", minutes)
    .replace("{MINUTES_LABEL}", label);
};

var ctrlSTimeMs = 435;
const getMinuteCount = (minutes) => Math.round((60000 * minutes) / ctrlSTimeMs);
const minutesToNotify = [1, 5, 15, 30, 45, 60];
const minutesWithCountToNotify = minutesToNotify.map((m) => ({
  minute: m,
  saveCount: getMinuteCount(m),
}));

const actions = {
  "Add a Review": async ({ context, minute }) => {
    vscode.env.openExternal(
      vscode.Uri.parse(
        "https://marketplace.visualstudio.com/items?itemName=codista.vscode-autosave&ssr=false#review-details",
        true
      )
    );
    track(
      context,
      TRACKED_ACTIONS.REVIEW_CLICK,
      { at: new Date().toUTCString() },
      {
        minute,
      }
    );
  },
  "Disable Progress Notifications": async ({ context, minute }) => {
    const configs = vscode.workspace.getConfiguration("vscode-autosave");
    await configs.update(
      "disableProgressNotifications",
      true,
      vscode.ConfigurationTarget.Global
    );
    track(
      context,
      TRACKED_ACTIONS.SILENCED_PROGRESS,
      { at: new Date().toUTCString() },
      { minute }
    );
  },
};

const notifyProgressAndUpdateHistory = async (
  { read, write, context },
  min
) => {
  const minutesNotified = read(stateKeys.MINUTES_NOTIFIED) || [];
  await write(stateKeys.MINUTES_NOTIFIED, [...minutesNotified, min]);
  const message = messageMinute(min);
  const selection = await vscode.window.showInformationMessage(
    message,
    {
      modal: true,
    },
    ...["Add a Review", "Disable Progress Notifications"]
  );

  track(
    context,
    TRACKED_ACTIONS.NOTIFIED,
    {
      message,
    },
    {
      minutes: min,
    }
  );

  if (selection) {
    await actions[selection]({ context, minute: min });
  }
  return message;
};

const notifyProgressIfNeeded = async (context, { read, write }, saveCount) => {
  const disabledNotifications = vscode.workspace
    .getConfiguration("vscode-autosave")
    .get("disableProgressNotifications");

  if (disabledNotifications) return;

  const [lastMinuteNotified] = (read(stateKeys.MINUTES_NOTIFIED) || []).slice(
    -1
  );

  const passedMinutes = minutesWithCountToNotify.filter(
    (x) => saveCount >= x.saveCount
  );
  if (!passedMinutes) return;

  passedMinutes.sort((a, b) => a.saveCount - b.saveCount);
  const [{ minute: nextMinuteToNotify }] = passedMinutes.slice(-1);
  if (!lastMinuteNotified || nextMinuteToNotify > lastMinuteNotified) {
    await notifyProgressAndUpdateHistory(
      { context, read, write },
      nextMinuteToNotify
    );
  }
};

module.exports = {
  notifyProgressIfNeeded,
};
