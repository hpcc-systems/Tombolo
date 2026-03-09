import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    globalTeardown: './tests/globalTeardown.js',

    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js',
        'vitest.config.js',
        'jest.config.js',
      ],
    },

    // Test file patterns
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules/', 'build/'],

    // Better test isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },

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
        include: ['tests/apiTests/**/*.test.js'],
        environment: 'node',
        globals: true,
        setupFiles: ['./tests/setup.js'],
      },
    },
    {
      test: {
        name: 'jobs',
        include: ['tests/breeJobs/**/*.test.js'],
        environment: 'node',
        globals: true,
        setupFiles: ['./tests/setup.js'],
      },
    },
  ],
});
