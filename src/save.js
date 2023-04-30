const { stateKeys, storeManager } = require("./store");
const { notifyProgressIfNeeded } = require("./notifications");
const { track, TRACKED_ACTIONS } = require("./tracker");

var mainContext, manager, read, write;

const countSave = async () => {
  const currentCount = read(stateKeys.SAVE_COUNT) || 0;
  const saveCount = currentCount + 1;
  await write(stateKeys.SAVE_COUNT, saveCount);
  const lastSavedTime = new Date();
  await write(stateKeys.LAST_SAVED_TIME, lastSavedTime);

  track(
    mainContext,
    TRACKED_ACTIONS.AUTOSAVED,
    {
      at: lastSavedTime.toUTCString(),
    },
    {
      saveCount,
    }
  );

  await notifyProgressIfNeeded(mainContext, manager, saveCount);
};

const justSaved = () => {
  const now = new Date();
  let lastSavedTime = read(stateKeys.LAST_SAVED_TIME);
  if (!lastSavedTime) return false; // FIRST TIME WILL BE NULL
  lastSavedTime = new Date(lastSavedTime);
  const diffInMs = Math.abs(now - new Date(lastSavedTime));
  const seconds = Math.floor(diffInMs / 1000);
  const justSaved = seconds < 2;
  if (justSaved) {
    return true;
  }
  return false;
};

const init = (context) => {
  mainContext = context;
  manager = storeManager(context);
  read = manager.read;
  write = manager.write;
};

const save = async (context, document) => {
  init(context);
  document.save();
  if (justSaved()) return;
  await countSave();
};

module.exports = {
  save,
};
