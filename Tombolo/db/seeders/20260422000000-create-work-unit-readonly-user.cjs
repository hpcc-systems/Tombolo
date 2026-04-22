'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const readOnlyUsername =
      process.env.READONLY_DB_USERNAME || 'work_unit_readonly';
    const readOnlyPassword = process.env.READONLY_DB_PASS;
    const readOnlyHost = process.env.DB_HOSTNAME || '%';
    const databaseName = process.env.DB_NAME;

    if (!readOnlyPassword) {
      throw new Error(
        'READONLY_DB_PASS is required to create the read-only database user.'
      );
    }

    if (!databaseName) {
      throw new Error('DB_NAME is required to grant table permissions.');
    }

    const quotedUser = `${queryInterface.sequelize.escape(readOnlyUsername)}@${queryInterface.sequelize.escape(readOnlyHost)}`;
    const escapedDatabaseName = databaseName.replace(/`/g, '``');

    await queryInterface.sequelize.query(
      `CREATE USER IF NOT EXISTS ${quotedUser} IDENTIFIED BY ${queryInterface.sequelize.escape(readOnlyPassword)}`
    );

    await queryInterface.sequelize.query(
      `ALTER USER ${quotedUser} IDENTIFIED BY ${queryInterface.sequelize.escape(readOnlyPassword)}`
    );

    await queryInterface.sequelize.query(
      `REVOKE ALL PRIVILEGES, GRANT OPTION FROM ${quotedUser}`
    );

    await queryInterface.sequelize.query(
      `GRANT SELECT ON \`${escapedDatabaseName}\`.\`work\\_unit%\` TO ${quotedUser}`
    );

    await queryInterface.sequelize.query(
      `GRANT SELECT ON \`${escapedDatabaseName}\`.\`clusters\` TO ${quotedUser}`
    );
  },

  async down(queryInterface) {
    const readOnlyUsername =
      process.env.READONLY_DB_USERNAME || 'work_unit_readonly';
    const readOnlyHost = process.env.DB_HOSTNAME || '%';
    const quotedUser = `${queryInterface.sequelize.escape(readOnlyUsername)}@${queryInterface.sequelize.escape(readOnlyHost)}`;

    await queryInterface.sequelize.query(`DROP USER IF EXISTS ${quotedUser}`);
  },
};
