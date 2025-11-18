# @tombolo/core

Core business logic and shared services for Tombolo.

## Purpose

This package contains reusable business logic, data access patterns, and integration services used across multiple Tombolo packages (server, jobs, etc.).

## Structure

```
src/
├── hpcc/        - HPCC cluster integration services
├── database/    - Database repository functions
└── index.js     - Barrel export
```

## Usage

```javascript
// CommonJS (server)
const { getClusters, getClusterOptions } = require("@tombolo/core");

// ES Modules (jobs)
import { getClusters, getClusterOptions } from "@tombolo/core";
```

## Dependencies

- `@tombolo/db` - Database models
- `@tombolo/shared` - Shared utilities
- `@hpcc-js/comms` - HPCC communication library

## What Goes Here

✅ **Include:**

- Shared HPCC integration logic
- Reusable database queries used by multiple packages
- Business logic used across server and jobs
- External API clients

❌ **Don't Include:**

- Route handlers (keep in server)
- Job-specific workers (keep in jobs)
- One-off queries used in single location
