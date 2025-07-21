module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "fileMonitoring",
        "name",
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
          after: "id",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "fileMonitoring",
        "application_id",
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
          after: "name",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "fileMonitoring",
        "cron",
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
          after: "application_id",
        },

        { transaction }
      );

        await queryInterface.addColumn(
          "fileMonitoring",
          "monitoringAssetType",
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            after: "cron",
          },
          { transaction }
        );

          await queryInterface.addColumn(
            "fileMonitoring",
            "monitoringActive",
            {
              type: Sequelize.DataTypes.BOOLEAN,
              allowNull: true,
              after: "monitoringAssetType",
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
      await queryInterface.removeColumn("fileMonitoring", "name", {
        transaction,
      });
      await queryInterface.removeColumn("fileMonitoring", "application_id", {
        transaction,
      });
       await queryInterface.removeColumn("fileMonitoring", "cron", {
         transaction,
       });

       await queryInterface.removeColumn(
         "fileMonitoring",
         "monitoringAssetType",
         {
           transaction,
         }
       );

      await queryInterface.removeColumn(
        "fileMonitoring",
        "monitoringActive",
        {
          transaction,
        }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
