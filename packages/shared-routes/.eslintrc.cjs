module.exports = {
  ...require("config/eslint-preset.cjs"),
  parserOptions: {
    root: true,
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  },
};
