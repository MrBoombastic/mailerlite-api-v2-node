const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const js = require("@eslint/js");

module.exports = defineConfig([
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },

            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {},
        },

        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        rules: {
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            semi: "off",
            quotes: ["error", "double"],
            "no-undef": "off",
            "no-unused-vars": "off",
        },
    },
    globalIgnores(["**/dist/", "**/node_modules/", "**/*.js"]),
]);
