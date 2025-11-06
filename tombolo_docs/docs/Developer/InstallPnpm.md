---
sidebar_position: -95
title: Install pnpm
---

## Prerequisites

- Node.js 18+ (20+ recommended)

## Installing pnpm with Corepack

Tombolo uses [pnpm](https://pnpm.io) as its package manager. The easiest way to install pnpm is using Corepack, which comes bundled with Node.js.

### Step 1: Enable Corepack

Corepack is included with Node.js but needs to be enabled:

```bash
corepack enable
```

If you encounter permission issues, you may need to run with elevated privileges:

```bash
corepack enable
```

### Step 2: Prepare and Activate pnpm

```bash
corepack prepare pnpm@latest --activate
```

### Step 3: Verify pnpm Installation

Corepack will automatically install and manage pnpm based on the version specified in the project's `package.json`. Verify it's working:

```bash
pnpm --version
```

### Step 4: Install Dependencies

Navigate to the project root and install all dependencies:

```bash
cd Tombolo
pnpm install
```

## Troubleshooting

### Corepack Not Found

If you get a "command not found" error, ensure you're using a recent version of Node.js (18+). Older versions may not include Corepack.

```bash
node --version
```

## Additional Resources

- [pnpm Documentation](https://pnpm.io)
- [Corepack Documentation](https://nodejs.org/api/corepack.html)
- [Node.js Downloads](https://nodejs.org)
