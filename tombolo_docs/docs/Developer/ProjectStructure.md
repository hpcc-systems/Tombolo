---
sidebar_position: -98
---

# Project Structure

Tombolo is organized as a **monorepo** using **pnpm workspaces** and **Turborepo** for efficient build orchestration and dependency management. This structure allows multiple related packages to coexist in a single repository while maintaining clear boundaries and enabling independent development and testing.

## Monorepo Architecture

The project leverages:

- **pnpm workspaces**: For managing dependencies across multiple packages with efficient disk usage and fast installations
- **Turborepo**: For orchestrating builds, tests, and development tasks with intelligent caching and parallel execution
- **Workspace protocol**: Packages reference each other using `workspace:*` for seamless local development

## Directory Structure

```
Tombolo/
│
├── package.json                    # Root package.json with monorepo scripts
├── pnpm-workspace.yaml            # pnpm workspace configuration
├── turbo.json                     # Turborepo pipeline configuration
├── pnpm-lock.yaml                 # Lockfile for all dependencies
│
├── Tombolo/                       # Main application workspace
│   ├── client-reactjs/            # @tombolo/client - React frontend (Vite)
│   │   ├── src/                   # React components and application code
│   │   ├── public/                # Static assets
│   │   ├── nginx/                 # Nginx configuration for production
│   │   ├── package.json           # Client dependencies and scripts
│   │   └── vite.config.js         # Vite build configuration
│   │
│   ├── server/                    # @tombolo/server - Express backend (CommonJS)
│   │   ├── routes/                # API route handlers
│   │   ├── config/                # Server configuration
│   │   ├── utils/                 # Utility functions
│   │   ├── jobs/                  # Background job handlers (legacy)
│   │   ├── tests/                 # API tests
│   │   ├── logs/                  # Server logs
│   │   ├── cluster-whitelist.js   # Cluster configuration
│   │   ├── server.js              # Main Express server
│   │   └── package.json           # Server dependencies and scripts
│   │
│   ├── jobs/                      # @tombolo/jobs - Background job processor (ESM, TypeScript)
│   │   ├── src/                   # TypeScript source code
│   │   │   ├── app.ts             # BullMQ job processor entry point
│   │   │   ├── config/            # Job system configuration
│   │   │   ├── queues/            # Queue definitions
│   │   │   ├── workers/           # Job worker implementations
│   │   │   └── scheduler.ts       # Job scheduling logic
│   │   ├── dist/                  # Compiled JavaScript output
│   │   ├── package.json           # Jobs dependencies (BullMQ, Redis)
│   │   └── tsconfig.json          # TypeScript configuration
│   │
│   ├── db/                        # @tombolo/db - Database models and migrations (CommonJS)
│   │   ├── models/                # Sequelize model definitions
│   │   ├── migrations/            # Database migration files
│   │   ├── seeders/               # Database seed data
│   │   ├── config/                # Sequelize configuration
│   │   ├── utils/                 # Database utilities
│   │   └── package.json           # Database dependencies (Sequelize, MySQL)
│   │
│   ├── core/                      # @tombolo/core - Business logic layer (CommonJS)
│   │   ├── src/                   # Core business logic
│   │   │   ├── hpcc/              # HPCC cluster integration
│   │   │   ├── database/          # Database utilities
│   │   │   └── config/            # Core configuration
│   │   └── package.json           # Core dependencies
│   │
│   ├── shared/                    # @tombolo/shared - Shared utilities (Hybrid: ESM + CommonJS)
│   │   ├── src/                   # Shared utility functions
│   │   │   ├── workunitConstants.js    # CommonJS version
│   │   │   ├── workunitConstants.mjs   # ESM version
│   │   │   ├── index.js                # CommonJS entry point
│   │   │   └── index.mjs               # ESM entry point
│   │   ├── backend.js             # Backend-only utilities (logging)
│   │   ├── index.js               # Main CommonJS entry point
│   │   ├── index.mjs              # Main ESM entry point
│   │   └── package.json           # Dual exports configuration
│   │
│   ├── docker-compose.yml         # Docker Compose configuration
│   ├── Dockerfile                 # Multi-stage Docker build
│   └── mysql-data/                # MySQL data directory (local dev)
│
├── e2e_tests/                     # End-to-end tests (Playwright)
│   ├── tests/                     # Test specifications
│   ├── poms/                      # Page Object Models
│   ├── playwright.config.ts       # Playwright configuration
│   └── package.json               # Test dependencies
│
├── tombolo_docs/                  # Documentation site (Docusaurus)
│   ├── docs/                      # Markdown documentation
│   ├── blog/                      # Blog posts
│   ├── src/                       # Custom Docusaurus components
│   ├── docusaurus.config.js       # Docusaurus configuration
│   └── package.json               # Docs dependencies
│
└── tagging/                       # Release management scripts
    ├── create-release.sh          # Create new releases
    ├── create-major.sh            # Major version bump
    ├── create-minor.sh            # Minor version bump
    ├── cherry-pick-fix.sh         # Cherry-pick fixes between branches
    └── upmerge.sh                 # Merge between branches
```

## Package Dependencies

The workspace packages have the following dependency relationships:

```
@tombolo/server (CommonJS)
├── @tombolo/db (CommonJS)
│   └── @tombolo/shared (Hybrid)
├── @tombolo/core (CommonJS)
│   ├── @tombolo/db (CommonJS)
│   └── @tombolo/shared (Hybrid)
└── @tombolo/shared (Hybrid)

@tombolo/jobs (ESM, TypeScript)
├── @tombolo/db (CommonJS)
├── @tombolo/core (CommonJS)
└── @tombolo/shared (Hybrid)

@tombolo/client (ESM, Vite)
└── @tombolo/shared (Hybrid)

@tombolo/shared (Hybrid)
└── (no workspace dependencies)
```

## Architecture Highlights

### Decoupled Client-Server Architecture

The React frontend (`client-reactjs`) is served independently by Nginx rather than the Node.js backend, enabling:

- **Separate development**: Frontend and backend can be developed and deployed independently
- **Independent scaling**: Scale client and server resources based on specific needs
- **Production optimization**: Static assets served efficiently by Nginx

### Dual Job Processing Systems

1. **Legacy system** (`server/jobs/`): Bree-based job scheduling (being phased out)
2. **Modern system** (`jobs/`): BullMQ with Redis for robust queue management and job processing

### Hybrid Module System

The `@tombolo/shared` package supports both module systems:

- **ESM (`.mjs` files)**: For Vite frontend and modern TypeScript jobs package
- **CommonJS (`.js` files)**: For Express server and Sequelize database package
- **Dual exports**: Package.json exports field routes imports correctly based on consumer

### Database Management

Sequelize ORM handles all database interactions with:

- Model definitions in `@tombolo/db`
- Migrations for schema versioning
- Seeders for initial/test data
- Shared across server and jobs packages

## Development Commands

From the root directory:

```bash
# Install all dependencies
pnpm install

# Start all development servers
pnpm dev

# Start specific package
pnpm server:dev   # Backend API server
pnpm client:dev   # Frontend Vite dev server

# Build all packages
pnpm build

# Run tests
pnpm test                # All tests
pnpm e2e:app            # E2E tests only

# Database operations
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed database
pnpm db:init            # Create, migrate, and seed

# Docker operations
pnpm docker:build       # Build Docker images
pnpm docker:up          # Start containers
pnpm docker:down        # Stop containers

# Documentation
pnpm docs:dev           # Start docs dev server
pnpm docs:build         # Build docs site
```

## Module Systems by Package

| Package           | Module System | Build Tool | Notes               |
| ----------------- | ------------- | ---------- | ------------------- |
| `@tombolo/client` | ESM           | Vite       | React frontend      |
| `@tombolo/server` | CommonJS      | None       | Express API         |
| `@tombolo/jobs`   | ESM           | TypeScript | BullMQ workers      |
| `@tombolo/db`     | CommonJS      | None       | Sequelize models    |
| `@tombolo/core`   | CommonJS      | None       | Business logic      |
| `@tombolo/shared` | Hybrid        | None       | Dual CommonJS + ESM |
| `e2e_tests`       | ESM           | TypeScript | Playwright tests    |
| `tombolo_docs`    | ESM           | Docusaurus | Documentation       |
