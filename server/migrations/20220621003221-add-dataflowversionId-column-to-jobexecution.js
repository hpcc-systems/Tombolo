module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'job_execution',
        'dataflowVersionId',
        {
          type: Sequelize.DataTypes.UUID,
          allowNull: true,
          after: "dataflowId",
          references: {
            model: 'dataflow_versions',
            key: 'id',
          },
          onUpdate: 'NO ACTION',
          onDelete: 'NO ACTION',
        },
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('job_execution', 'dataflowVersionId', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};