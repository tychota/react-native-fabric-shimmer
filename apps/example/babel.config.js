module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "react" }]],
    plugins: [["babel-plugin-react-compiler", { target: "19" }], "react-native-worklets/plugin"],
  };
};
