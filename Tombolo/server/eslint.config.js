const globals = require('globals');

module.exports = [
  {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
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
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },
];
