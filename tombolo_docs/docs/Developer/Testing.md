---
sidebar_position: 2
pagination_next: null
pagination_prev: null
title: Backend Testing
---

# Backend Testing

Tombolo uses Jest and Supertest for its testing framework. Jest provides a flexible environment for writing and running tests, while Supertest allows us to easily test our API endpoints. By combining these tools, we ensure our tests are both reliable and effective.

Our testing strategy is designed to closely resemble the production environment. This helps us catch potential issues early, ensuring the stability and consistency of our application as we continue development.

Before running or writing tests, please add the following environment variables to the backend `.env` file. The values provided are examples:

```
TEST_SERVER_PORT: Port for the test server (e.g., 3002)
TEST_DB_HOSTNAME: Hostname for the test database (e.g., localhost)
TEST_DB_USERNAME: Username for the test database (e.g., root)
TEST_DB_PASSWORD: Password for the test database (e.g., root)
TEST_DB_PORT: Port for the test database (e.g., 3306)
TEST_DB_NAME: Name of the test database (e.g., tombolo_test)
```

---

### Starting Tests

To start the tests, use the following command, defined in the package.json scripts. This will set up the test environment, execute the tests, and then properly tear down the test environment, ensuring a clean and isolated test process

```bash
npm run test
```

---

### Adding Tests

All tests and test-related configurations are in the `tests` directory inside `server`. To add a test, create a new file with a `.test.js` extension in the appropriate `tests` subdirectory. For example, if you are writing a test for a piece of function, you might want to do that inside the `unit-tests` subdirectory. If the matching or relevant subdirectory does not exist, you may create one.

Ensure that the file names are descriptive, reflecting the functionality being tested. This makes it easier to identify and manage individual test cases. For consistency, you can refer to existing test files as templates when structuring your tests. This helps maintain uniformity across the test suite, making it easier to read, understand, and debug as needed.

If you are writing a test to test APIs, which is an end-to-end testing for a route, be sure to import that route in the `test_server.js`.

---

### Comprehensive Test Lifecycle

When the `npm run test` command is executed, the following steps take place:

1. **Jest Initialization**: The command references the `jest.config.js` file, where paths for global setup and teardown are defined, along with other test configurations.
2. **Environment Setup**: The global setup script prepares the test environment by creating a dedicated test database, running migrations, seeding initial data, starting the server, and establishing the necessary database connections.
3. **Test Execution**: With the environment ready, the tests are run, and the results, including pass/fail statuses and error details, are displayed in the console.
4. **Environment Teardown**: After all tests have been executed, the global teardown script cleans up by removing the test database, stopping the server, and closing database connections, ensuring a clean exit.

---

### Pull Request Guidelines

When submitting a pull request (PR), it's essential to include relevant tests for any new functionality or changes. All tests, both new and existing, must pass successfully to ensure that the changes do not introduce regressions or break existing features. This practice helps maintain the stability and integrity of the codebase while allowing for smooth integration of new updates.
