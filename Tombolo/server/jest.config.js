
module.exports = {
  // Specify the pattern Jest should use to detect test files
  testMatch: ["<rootDir>/tests/**/*.(spec|test).[jt]s?(x)"],

  // Ignore certain directories when running tests
  testPathIgnorePatterns: ["/node_modules/", "/build/"],

  // Setup files to run before each test suite
  setupFiles: ["<rootDir>/tests/setup.js"],
  globalSetup: "<rootDir>/tests/globalSetup.js",
  globalTeardown: "<rootDir>/tests/teardown.js",

  // Specify the test environment (node or jsdom)
  testEnvironment: "node",

  // Collect coverage information when running tests
  collectCoverage: true,

  // Ignore specific paths when running in watch mode
  watchPathIgnorePatterns: ["/node_modules/"],

  // Choose coverage reporters
  coverageReporters: ["text-summary"],

  // Limit the number of worker processes
  maxWorkers: "50%",
};
