'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
    await Promise.all([
      queryInterface.dropTable('dataflowgraph', { transaction }),
      queryInterface.dropTable('GHCredentials', { transaction }),
      queryInterface.dropTable('dependent_jobs', { transaction }),
      queryInterface.dropTable('assets_dataflows', { transaction }),
      ]);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
