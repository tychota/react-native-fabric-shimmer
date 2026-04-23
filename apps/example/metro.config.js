// Expo SDK 55+ auto-configures Metro for monorepos — no manual overrides
// needed. Pre-SDK-52 workarounds (watchFolders, nodeModulesPaths,
// disableHierarchicalLookup) actively BREAK native module autolinking with
// isolated pnpm installs.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
