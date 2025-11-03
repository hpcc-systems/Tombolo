'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JobParam extends Model {
    static associate(models) {
      JobParam.belongsTo(models.Job, { foreignKey: 'job_id' });
      JobParam.belongsTo(models.Application, { foreignKey: 'application_id' });
    }
  }

  JobParam.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      job_id: DataTypes.UUID,
      application_id: DataTypes.UUID,
      name: DataTypes.STRING,
      type: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'JobParam',
      tableName: 'job_params',
      paranoid: true,
    }
  );

  return JobParam;
};
