# @tombolo/shared

Shared utilities and common functionality for Tombolo packages.

## Purpose

This package contains reusable code that is used across multiple Tombolo packages (server, jobs, db, etc.). By centralizing common functionality here, we reduce duplication and maintain consistency.

## Usage

Install as a dependency in any Tombolo package:

```json
{
  "dependencies": {
    "@tombolo/shared": "workspace:*"
  }
}
```

Then import utilities:

```javascript
const { logger } = require('@tombolo/shared');
// or
import { logger } from '@tombolo/shared';
```

## Structure

```
shared/
├── index.js          # Main entry point, exports all utilities
├── utils/            # Utility functions
│   ├── logger.js     # Logging utilities
│   └── ...
├── constants/        # Shared constants
└── types/            # TypeScript type definitions (if needed)
```

## Adding New Utilities

1. Create your utility file in the appropriate directory
2. Export it from `index.js`
3. Update this README with usage examples
4. Run `pnpm install` in packages that need the new functionality

## Development

Since this is a shared package, changes here affect all dependent packages. Test thoroughly before committing.
