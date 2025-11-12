import globals from 'globals';
import tseslint from 'typescript-eslint';
import rootConfig from '../../eslint.config.mjs';

export default [
  // TypeScript recommended first
  ...tseslint.configs.recommended,

  // Then inherit root config (this will override TS defaults)
  ...rootConfig,

  // TypeScript-specific overrides
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },

  // Package-specific rules (last, highest priority)
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Override root's no-console for this package (we want console logs in workers)
      'no-console': 'off',
    },
  },
];
