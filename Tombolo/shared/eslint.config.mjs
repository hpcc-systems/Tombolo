import rootConfig from '../../eslint.config.mjs';
import globals from 'globals';

export default [
  // Inherit root config
  ...rootConfig,

  // Override for CommonJS
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.commonjs,
        ...globals.node,
      },
    },
  },
];
