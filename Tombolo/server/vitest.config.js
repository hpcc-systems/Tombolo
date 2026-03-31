import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globalTeardown: './tests/globalTeardown.ts',

    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vitest.config.js',
        '.sequelizerc.docker',
        'process.yml',
        'nodemon.json',
        'tsx-worker-loader.mjs',
        'cluster-whitelist.*',
      ],
    },

    // Test file patterns
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/', 'build/'],

    // Better test isolation
    pool: 'forks',

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,

    // Reporter configuration
    reporter: ['verbose'],

    // Max workers
    maxConcurrency: 4,
  },

  // Workspace configuration for multiple test projects
  workspace: [
    {
      test: {
        name: 'api',
        include: ['tests/apiTests/**/*.test.ts'],
        environment: 'node',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
      },
    },
    {
      test: {
        name: 'jobs',
        include: ['tests/breeJobs/**/*.test.ts'],
        environment: 'node',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
      },
    },
  ],
});
