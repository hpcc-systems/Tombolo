/* Do not mix code formatting rules with linting rules. 
Please add code formatting rules to .prettierrc file */
import baseConfig from '../../eslint.config.mjs';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: false },
      ],
      'no-console': ['warn', { allow: ['info', 'error'] }],
    },
  },
];
