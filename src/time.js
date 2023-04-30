const groupTime = (ms) => {
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  return {
    seconds,
    minutes,
    hours,
  };
};

module.exports = {
  groupTime,
};
