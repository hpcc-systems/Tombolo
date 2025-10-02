---
sidebar_position: 2
pagination_next: null
pagination_prev: null
title: Backend Testing
---

# Backend Testing

Tombolo uses Jest for backend testing. We currently focus on unit tests. Supertest is available for API route tests.

Our tests run in a lightweight, fully mocked environment to keep feedback fast and deterministic. Database access and logging are mocked by the shared Jest setup file, so no real database is used during tests.

---

### Test Locations and Structure

All backend tests and helpers live under `Tombolo/server/tests`:
- `breeJobs/` – unit tests for job utilities and related logic.
- `apiTests/` – scaffolding for API tests using Express and Supertest.
- `setup.js` – shared Jest setup that:
  - Loads `.env` from the repository root or `server/.env`.
  - Mocks `../models` (Sequelize models) to avoid real DB access.
  - Mocks console logging and Winston loggers/rotations.
- `test_server.js` – a lightweight Express app wiring server routes; used only if you add API tests.

Jest configuration (`Tombolo/server/jest.config.js`) declares two projects:
- `jobs`: matches `tests/breeJobs/**/*.test.js`.
- `api`: matches `tests/apiTests/**/*.test.js`.
Both projects use `testEnvironment: 'node'` and `setupFiles: ['<rootDir>/tests/setup.js']`. Coverage is collected with the `text-summary` reporter.

---

### Running Tests

From `Tombolo/server`:

```bash
npm run test            # run all Jest projects
npm run test:jobs       # run only unit tests under tests/breeJobs
npm run test:api        # run only API tests under tests/apiTests
```

Note: At present, the active test suite is the unit tests. API tests exist as scaffolding and may be expanded; some example API tests may be placeholders.

---

### Environment Variables

- Unit tests: no special environment variables are required; `tests/setup.js` loads `.env` if present and mocks I/O and DB.

---

### Adding Tests

- Create files ending with `.test.js` in the appropriate subdirectory (e.g., `tests/breeJobs/YourModule.test.js`).
- Prefer small, focused unit tests. Use the existing test files as references for style and helpers.
- If you add API tests, import routes via `tests/test_server.js` and use Supertest to hit the endpoints. Keep in mind our current emphasis is on unit tests.

---

### What Happens When You Run Tests

When `npm run test` runs:
1. Jest reads `jest.config.js` and loads the two projects.
2. For each project, `tests/setup.js` runs first to load env and install mocks (models, logging, etc.).
3. Jest executes the tests and prints a coverage summary.

There is no global DB setup/teardown step, and no migrations/seeds are run as part of tests.

---

### Pull Request Guidelines

Include or update unit tests for any new backend logic or bug fixes. All tests (and any added API tests) must pass in CI. Keep tests fast, isolated, and free of external side effects.
