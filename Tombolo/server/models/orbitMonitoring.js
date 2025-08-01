'use strict';
module.exports = (sequelize, DataTypes) => {
  const orbitMonitoring = sequelize.define(
    'orbitMonitoring',
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
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      cron: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      build: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      businessUnit: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      product: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      severityCode: {
        allowNull: false,
        type: DataTypes.TINYINT,
      },
      host: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      primaryContact: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      secondaryContact: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
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
  orbitMonitoring.associate = function (models) {
    // Define association here
    orbitMonitoring.belongsTo(models.application, {
      foreignKey: 'application_id',
    });
    orbitMonitoring.hasMany(models.monitoring_notifications, {
      foreignKey: 'application_id',
      onDelete: 'CASCADE',
    });
  };
  return orbitMonitoring;
};
