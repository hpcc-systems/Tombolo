import rootConfig from '../../eslint.config.mjs';
import globals from 'globals';

export default [
  // Inherit root config
  ...rootConfig,

  // Override for CommonJS
  {
    files: ['**/*.js', '!dist/'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.es2020,
        ...globals.node,
      },
    },
  },
];
