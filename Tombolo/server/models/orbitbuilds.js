'use strict';
module.exports = (sequelize, DataTypes) => {
  const orbitBuilds = sequelize.define(
    'orbitBuilds',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      application_id: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      monitoring_id: {
        allowNull: true,
        type: DataTypes.UUID,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      wuid: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      build_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    { paranoid: true, freezeTableName: true }
  );
  orbitBuilds.associate = function (models) {
    // Define association here
    orbitBuilds.belongsTo(models.Application, {
      foreignKey: 'application_id',
    });
    orbitBuilds.hasMany(models.monitoring_notifications, {
      foreignKey: 'application_id',
      onDelete: 'CASCADE',
    });
  };
  return orbitBuilds;
};
