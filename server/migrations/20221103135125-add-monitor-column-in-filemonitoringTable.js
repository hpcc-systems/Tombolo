module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "filemonitoring",
        "name",
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
          after: "id",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "filemonitoring",
        "application_id",
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
          after: "name",
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "filemonitoring",
        "cron",
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
          after: "application_id",
        },

        { transaction }
      );

        await queryInterface.addColumn(
          "filemonitoring",
          "monitoringAssetType",
          {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            after: "cron",
          },
          { transaction }
        );

          await queryInterface.addColumn(
            "filemonitoring",
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
      await queryInterface.removeColumn("filemonitoring", "name", {
        transaction,
      });
      await queryInterface.removeColumn("filemonitoring", "application_id", {
        transaction,
      });
       await queryInterface.removeColumn("filemonitoring", "cron", {
         transaction,
       });

       await queryInterface.removeColumn(
         "filemonitoring",
         "monitoringAssetType",
         {
           transaction,
         }
       );

      await queryInterface.removeColumn(
        "filemonitoring",
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
