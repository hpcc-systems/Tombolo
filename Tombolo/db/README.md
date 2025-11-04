# @tombolo/db

Shared database package containing Sequelize models, migrations, and database connection configuration for the Tombolo monorepo.

## Structure

```
db/
├── config/         # Database connection configuration
├── models/         # Sequelize model definitions
├── migrations/     # Database migrations
├── utils/          # Shared utilities for models
└── package.json
```

## Usage

Import models and database connection from this package:

```javascript
const { User, Application, Job, sequelize, Sequelize } = require("@tombolo/db");

// Use models
const users = await User.findAll();

// Access sequelize instance
await sequelize.query("SELECT * FROM users");
```

## Configuration

This package reads environment variables from the `.env` file in the Tombolo root folder (`/Users/odonnels/Projects/Tombolo/Tombolo/.env`).

Required environment variables:

- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_HOSTNAME`
- `MYSQL_SSL_ENABLED` (optional)

## Migrations

Run migrations from this package:

```bash
cd Tombolo/db
pnpm migrate
```

Or from the root:

```bash
pnpm --filter @tombolo/db migrate
```

## Adding New Models

1. Create a new model file in `models/` directory
2. The model will be automatically loaded by `models/index.js`
3. No changes needed to the index file (uses dynamic loading)

## Notes

- Models are dynamically loaded, so all `.js` files in the `models/` directory (except `index.js`) are automatically imported
- The package maintains backward compatibility with the server's original import patterns
- All model associations are set up automatically during initialization
