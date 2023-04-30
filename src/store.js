const storeManager = (context) => {
  const read = (key) => {
    return context.globalState.get(key);
  };

  const write = async (key, value) => {
    await context.globalState.update(key, value);
  };

  return { read, write };
};

const stateKeys = {
  LAST_SAVED_TIME: "LAST_SAVED_TIME",
  SAVE_COUNT: "SAVE_COUNT",
  MINUTES_NOTIFIED: "MINUTES_NOTIFIED",
  NOTIFIED: "NOTIFIED",
};

module.exports = {
  stateKeys,
  storeManager,
};
