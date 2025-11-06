import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setupTests.js',
    // Better test isolation configuration
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    isolate: true,
    maxConcurrency: 1,
    sequence: {
      sequential: true,
    },
    // Add error reporting configuration
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json',
    },
    // Increase timeout to help with debugging
    testTimeout: 10000,
    hookTimeout: 10000,
    // Clear mocks and DOM after each test
    clearMocks: true,
    restoreMocks: true,
    // Better environment setup
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
  // Ensure proper module resolution for monorepo
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
