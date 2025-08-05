'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FileValidation extends Model {
    static associate(models) {
      FileValidation.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });
      FileValidation.belongsTo(models.File, { foreignKey: 'file_id' });
    }
  }

  FileValidation.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: DataTypes.UUID,
      file_id: DataTypes.UUID,
      rule_field: DataTypes.STRING,
      rule_name: DataTypes.STRING,
      rule_test: DataTypes.STRING,
      rule_fix: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'FileValidation',
      tableName: 'file_validations',
      paranoid: true,
      freezeTableName: true,
    }
  );

  return FileValidation;
};
