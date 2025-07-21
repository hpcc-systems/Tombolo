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
    application_id: DataTypes.UUID,
    file_id: DataTypes.UUID,
    rule_field: DataTypes.STRING,
    rule_name: DataTypes.STRING,
    rule_test: DataTypes.STRING,
    rule_fix: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  file_validation.associate = function(models) {
    file_validation.belongsTo(models.application, {foreignKey: 'application_id'});
    file_validation.belongsTo(models.file, {foreignKey: 'file_id'});
  };
  return file_validation;
};