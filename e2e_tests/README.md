# Tombolo End-to-End Tests

This directory contains a comprehensive Playwright-based end-to-end testing suite for the Tombolo application. The tests cover user workflows from authentication through application monitoring functionality.

## Project Structure

```
e2e_tests/
├── tests/                    # Test specifications
├── poms/                     # Page Object Models
├── playwright.config.ts      # Playwright configuration
├── global-setup.ts          # Global test setup (authentication)
├── helpers.ts               # Test utility functions
├── package.json             # Dependencies and scripts
├── .env.sample              # Environment configuration template
└── sample-cd.yaml           # CI/CD pipeline example
```

## Quick Start

### Prerequisites

- Node.js 20+
- Tombolo frontend and backend running locally
- Valid user credentials for authentication

### Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.sample .env
   # Edit .env with your credentials
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install --with-deps
   ```

### Running Tests

| Command                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| `npm test`                | Run all tests                                 |
| `npm run test:app`        | Run admin + monitoring projects               |
| `npm run test:admin`      | Run admin tests only (applications, clusters) |
| `npm run test:monitoring` | Run monitoring tests only                     |
| `npm run test:wizard`     | Run initial experience and login tests        |
| `npm run test:ui`         | Run tests with UI mode                        |
| `npm run test:debug`      | Run tests in debug mode                       |

## Test Organization

### Test Projects

The test suite is organized into three projects that run in a specific order:

1. **`wizard`** - Authentication and setup flows (no shared state)

   - `login.spec.ts`
   - `initial-experience.spec.ts`

2. **`admin`** - Core application setup (runs first, serially)

   - `applications.spec.ts`
   - `clusters.spec.ts`

3. **`monitoring`** - Monitoring functionality (depends on admin)
   - `cluster-monitoring.spec.ts`
   - `cost-monitoring.spec.ts`
   - `file-monitoring.spec.ts`
   - `job-monitoring.spec.ts`
   - `lz-monitoring.spec.ts`

### Test Files

| Test File                    | Description                          |
| ---------------------------- | ------------------------------------ |
| `login.spec.ts`              | User authentication flows            |
| `initial-experience.spec.ts` | First-time user setup wizard         |
| `applications.spec.ts`       | Application CRUD operations          |
| `clusters.spec.ts`           | Cluster management                   |
| `cluster-monitoring.spec.ts` | Cluster monitoring configuration     |
| `cost-monitoring.spec.ts`    | Cost monitoring setup and management |
| `file-monitoring.spec.ts`    | File monitoring workflows            |
| `job-monitoring.spec.ts`     | Job monitoring configuration         |
| `lz-monitoring.spec.ts`      | Landing zone monitoring              |

## Page Object Models (POMs)

The `poms/` directory contains reusable page objects that encapsulate UI interactions:

| POM                              | Purpose                       |
| -------------------------------- | ----------------------------- |
| `LoginPage.ts`                   | Authentication workflows      |
| `InitialExperienceWizardPage.ts` | Setup wizard interactions     |
| `ApplicationsPage.ts`            | Application management        |
| `ClustersPage.ts`                | Cluster operations            |
| `ClusterMonitoringPage.ts`       | Cluster monitoring setup      |
| `CostMonitoringPage.ts`          | Cost monitoring configuration |
| `FileMonitoringPage.ts`          | File monitoring workflows     |
| `JobMonitoringPage.ts`           | Job monitoring setup          |
| `LandingZoneMonitoringPage.ts`   | Landing zone monitoring       |

### POM Usage Example

```typescript
import { test, expect } from "@playwright/test";
import { CostMonitoringPage } from "../poms/CostMonitoringPage";

test("create cost monitoring", async ({ page }) => {
  const cost = new CostMonitoringPage(page);
  await cost.goto();
  await cost.openAddModal();
  await cost.fillBasicTab({
    monitoringName: "My CM",
    description: "desc",
    monitoringScope: "users",
    clusters: ["Cluster A"],
    users: ["*"],
  });
  await cost.goToNotificationsTab();
  await cost.fillNotificationTab({
    threshold: 100,
    isSummed: false,
    primaryContacts: ["someone@example.com"],
  });
  await cost.submit();
});
```

## Configuration

### Environment Variables

Configure these in your `.env` file:

```bash
FRONTEND_URL=http://localhost:3000  # Frontend URL
USER_EMAIL=your-email@example.com   # Test user email
USER_PASS=YourPassword123           # Test user password
```

### Playwright Configuration Highlights

- **Global Setup**: Automatic authentication and state preservation
- **Project Dependencies**: Tests run in logical order (wizard → admin → monitoring)
- **Auto-Server Startup**: Automatically starts frontend/backend before tests
- **Browser Support**: Configured for Chrome (easily extensible)
- **Parallel Execution**: Controlled to prevent test interference

## Utilities

### Global Setup (`global-setup.ts`)

- Performs one-time authentication
- Saves session state for test reuse
- Gracefully handles missing credentials

### Helpers (`helpers.ts`)

Common utilities including:

- `closeAntTourIfPresent()` - Dismisses UI tour overlays
- Additional test helpers for common workflows

## Reporting

- **HTML Reports**: Generated in `playwright-report/`
- **Test Results**: Stored in `test-results/`
- **Screenshots/Videos**: Captured on failure (configurable)

## CI/CD Integration

A sample GitHub Actions workflow is provided in `sample-cd.yaml` showing how to:

- Set up MySQL database
- Install dependencies and browsers
- Run the full test suite
- Handle test artifacts

## 🔍 Debugging

### Debug Mode

```bash
npm run test:debug
# Opens tests in debug mode with step-through capability
```

### UI Mode

```bash
npm run test:ui
# Interactive test runner with live browser view
```

### Codegen

```bash
npm run codegen
# Generate test code by recording browser interactions
```

## Best Practices

1. **Use POMs**: Leverage page objects for maintainable, reusable code
2. **Accessible Selectors**: POMs prioritize accessible roles and labels
3. **Test Isolation**: Each test should be independent and clean up after itself
4. **Meaningful Names**: Use descriptive test and variable names
5. **Environment Specific**: Keep configuration flexible for different environments

## Troubleshooting

### Common Issues

| Issue                   | Solution                                           |
| ----------------------- | -------------------------------------------------- |
| Tests fail with timeout | Ensure frontend/backend are running and accessible |
| Authentication failures | Verify USER_EMAIL/USER_PASS in .env file           |
| Browser not found       | Run `npx playwright install --with-deps`           |
| Port conflicts          | Check that ports 3000/3001 are available           |

### Getting Help

- Check Playwright logs in `test-results/`
- Review HTML report in `playwright-report/`
- Use debug mode for step-by-step troubleshooting
