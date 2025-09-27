module.exports = {
  env: {
    es2022: true,
    node: true,
    jest: true,
  },
  extends: ["eslint:recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    semi: "off",
    quotes: ["error", "double"],
    "no-undef": "off",
    "no-unused-vars": "off",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js"],
};
