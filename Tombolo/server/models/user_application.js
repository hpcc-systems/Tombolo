'use strict';
module.exports = (sequelize, DataTypes) => {
  const user_application = sequelize.define(
    'user_application',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_app_relation: {
        type: DataTypes.ENUM('created', 'shared', 'assigned'),
        allowNull: false,
      },
      createdBy: {
        // Who created this relation - creator himself/herself , admin or shared by other user
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'user_application',
      paranoid: true,
      freezeTableName: true,
      timestamps: true,
    }
  );

  user_application.associate = function (models) {
    user_application.belongsTo(models.User, { foreignKey: 'user_id' });
    user_application.belongsTo(models.Application, {
      foreignKey: 'application_id',
    });
  };

  return user_application;
};
