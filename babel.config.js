module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo (SDK 54) configures the Reanimated / Worklets plugin automatically.
  return { presets: ['babel-preset-expo'] };
};
