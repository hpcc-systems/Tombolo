'use strict';
module.exports = (sequelize, DataTypes) => {
  const file_validation = sequelize.define('file_validation', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    file_id: DataTypes.STRING,
    rule_field: DataTypes.STRING,
    rule_name: DataTypes.STRING,
    rule_test: DataTypes.STRING,
    rule_fix: DataTypes.STRING
  }, {freezeTableName: true});
  file_validation.associate = function(models) {
  };
  return file_validation;
};