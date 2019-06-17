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
    name: DataTypes.STRING,
    sequence: DataTypes.STRING,
    ruleType: DataTypes.STRING,
    rule: DataTypes.STRING,
    action: DataTypes.STRING,
    fixScript: DataTypes.STRING
  }, {freezeTableName: true});
  file_validation.associate = function(models) {
  };
  return file_validation;
};