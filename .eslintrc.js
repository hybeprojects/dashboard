module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "next"],
  rules: {
    "@typescript-eslint/no-explicit-any": 0
  },
  ignorePatterns: ["dist", "node_modules"]
};
