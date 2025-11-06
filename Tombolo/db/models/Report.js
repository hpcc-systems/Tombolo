'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    static associate(models) {
      Report.belongsTo(models.Application, { foreignKey: 'application_id' });
    }
  }

  Report.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      type: DataTypes.STRING,
      comparedId: DataTypes.UUID,
      comparedName: DataTypes.STRING,
      isBaseLine: DataTypes.BOOLEAN,
      report: DataTypes.JSON,
      application_id: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: 'Report',
      tableName: 'reports',
      paranoid: true,
      freezeTableName: true,
    }
  );

  return Report;
};
