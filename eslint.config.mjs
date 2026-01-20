/*  Do not add any code formatting rules to this file. This file is only for linting rules.
 Add code formatting rules to the .prettierrc file to avoid conflicts */
import globals from "globals";
import js from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.es2021,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: false,
          caughtErrorsIgnorePattern: "^_", // ← but ignore if they start with _
        },
      ],
      "no-console": ["warn", { allow: ["info", "error"] }],
    },
  },
];
