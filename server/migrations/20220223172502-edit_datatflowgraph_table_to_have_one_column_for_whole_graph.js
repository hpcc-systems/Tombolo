'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn( 'dataflowgraph', 'nodes', Sequelize.DataTypes.JSON, { transaction } ),
      await queryInterface.removeColumn( 'dataflowgraph', 'edges', Sequelize.DataTypes.JSON , { transaction }),
      await queryInterface.addColumn('dataflowgraph', 'graph', { type: Sequelize.DataTypes.JSON, after: 'id', }, { transaction }),
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('dataflowgraph', 'graph', Sequelize.DataTypes.JSON, { transaction }),
      await queryInterface.addColumn( 'dataflowgraph', 'edges', { type: Sequelize.DataTypes.JSON, after: 'id' } , { transaction }),
      await queryInterface.addColumn( 'dataflowgraph', 'nodes', { type: Sequelize.DataTypes.JSON, after: 'id' }, { transaction } ),
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
