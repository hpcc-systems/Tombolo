'use strict';
module.exports = (sequelize, DataTypes) => {
  const file_field_relation = sequelize.define('file_field_relation', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    file_id: DataTypes.STRING,
    field: DataTypes.STRING,
    source_field: DataTypes.STRING,
    requirements: DataTypes.STRING
  }, {freezeTableName: true});
  file_field_relation.associate = function(models) {
  };
  return file_field_relation;
};