'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_key', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      application_id: {
        type: Sequelize.UUID,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
      },
      apiKey: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.UUIDV4,
      },
      expirationDate: {
        type: Sequelize.BIGINT,
      },
      expired: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      metaData: {
        type: Sequelize.JSON,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('api_key');
  },
};
