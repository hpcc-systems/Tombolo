import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setupTests.ts',
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/vite.config.js',
        '**/vitest.config.js',
        'nginx/',
        'public/',
        'eslint.config.mjs',
      ],
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    isolate: true,
    maxConcurrency: 1,
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json',
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    clearMocks: true,
    restoreMocks: true,
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, '../../node_modules'),
    },
  },
  optimizeDeps: {
    include: [
      '@ant-design/plots',
      '@ant-design/charts',
      '@antv/g2',
      '@antv/component',
      '@antv/coord',
      '@antv/scale',
      'color-string',
    ],
  },
});
