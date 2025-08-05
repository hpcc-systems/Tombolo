'use strict';
module.exports = (sequelize, DataTypes) => {
  const directoryMonitoring = sequelize.define(
    'directoryMonitoring',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      cluster_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      cron: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      active: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      machine: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      landingZone: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      directory: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      approved: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      approvalStatus: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      approvalNote: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      approvedBy: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      approvedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdBy: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      updatedBy: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      paranoid: true,
      freezeTableName: true,
      indexes: [
        {
          unique: true,
          fields: ['name', 'deletedAt'],
        },
      ],
    }
  );

  directoryMonitoring.associate = function (models) {
    // Define association here
    directoryMonitoring.belongsTo(models.Application, {
      foreignKey: 'application_id',
    });
    directoryMonitoring.belongsTo(models.Cluster, {
      foreignKey: 'cluster_id',
    });
  };

  return directoryMonitoring;
};
