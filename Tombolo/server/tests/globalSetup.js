const chalk = require("chalk");
const { execSync } = require("child_process");
const { startServer } = require("./test_server");

module.exports = async () => {
  console.log(chalk.blue.bold("\nSetting up test environment"));

  // Drop the existing schema
  console.log("[1/5] : Dropping existing test database...");
  execSync("cross-env NODE_ENV=test npx sequelize db:drop");

  // Create the schema
  console.log("[2/5] : Creating test database...");
  execSync("cross-env NODE_ENV=test npx sequelize db:create");

  // Run migrations
  console.log("[3/5] : Running migrations...");
  execSync("cross-env NODE_ENV=test npx sequelize db:migrate");

  // Seed the database
  console.log("[4/5] : Seeding test database...");
  execSync("cross-env NODE_ENV=test npx sequelize db:seed:all");

  // Start test server
  console.log("[5/5] : Starting test server...");
  await startServer();

  console.log(chalk.blue.bold("Global setup complete."));
};
