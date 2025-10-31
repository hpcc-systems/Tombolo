module.exports = {
  // Specify the pattern Jest should use to detect test files
  // testMatch: ['<rootDir>/tests/**/*.(spec|test).[jt]s?(x)'],

  // Transform ESM modules from node_modules (needed for monorepo with hoisted deps)
  transform: {
    '^.+\\.m?js$': [
      'babel-jest',
      {
        configFile: false,
        presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@hpcc-js|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
  ],

  projects: [
    {
      displayName: 'api',
      testMatch: ['<rootDir>/tests/apiTests/**/*.test.js'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/setup.js'],
      testPathIgnorePatterns: ['/node_modules/', '/build/'],
      transform: {
        '^.+\\.m?js$': [
          'babel-jest',
          {
            configFile: false,
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
          },
        ],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@hpcc-js|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
      ],
      // Optional per-project setup:
      // setupFiles: ['<rootDir>/tests/apiTests/setupEnv.js'],
      // setupFilesAfterEnv: ['<rootDir>/tests/apiTests/setupAfterEnv.js'],
      // testTimeout: 30000,
    },
    {
      displayName: 'jobs',
      testMatch: ['<rootDir>/tests/breeJobs/**/*.test.js'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/setup.js'],
      testPathIgnorePatterns: ['/node_modules/', '/build/'],
      transform: {
        '^.+\\.m?js$': [
          'babel-jest',
          {
            configFile: false,
            presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
          },
        ],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@hpcc-js|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
      ],
      // setupFilesAfterEnv: ['<rootDir>/tests/breeJobs/setupAfterEnv.js'],
    },
  ],

  // Ignore certain directories when running tests

  // Setup files to run before each test suite
  // setupFiles: ['<rootDir>/tests/setup.js'],
  // globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',

  // Specify the test environment (node or jsdom)
  // testEnvironment: 'node',

  // Collect coverage information when running tests
  collectCoverage: true,

  // Ignore specific paths when running in watch mode
  watchPathIgnorePatterns: ['/node_modules/'],

  // Choose coverage reporters
  coverageReporters: ['text-summary'],

  // Limit the number of worker processes
  maxWorkers: '50%',
};
