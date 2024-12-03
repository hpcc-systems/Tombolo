const { execSync } = require("child_process");
const chalk = require("chalk");
const { closeServer, db } = require("./test_server");

module.exports = async () => {
  console.log(chalk.blue.bold("Dismantling test environment"));


  console.log("[1/3] : Disconnecting from test database...");
  await db.sequelize.close();

  console.log("[2/3] : Shutting down test server..");
  closeServer();

  console.log("[3/3] : Dropping test database ...");
  execSync("cross-env NODE_ENV=test npx sequelize db:drop");

  console.log(chalk.blue.bold("Dismantling test environment complete."));
};
