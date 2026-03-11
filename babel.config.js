module.exports = function (api) {
  api.cache(true);

  let expoPreset;
  try {
    expoPreset = require("babel-preset-expo");
  } catch {
    expoPreset = require("expo/node_modules/babel-preset-expo");
  }

  return {
    presets: [expoPreset],
    plugins: ["react-native-reanimated/plugin"]
  };
};
