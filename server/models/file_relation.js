'use strict';
module.exports = (sequelize, DataTypes) => {
  const file_relation = sequelize.define('file_relation', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    file_id: DataTypes.STRING,
    source_file_id: DataTypes.STRING
  }, {freezeTableName: true});
  file_relation.associate = function(models) {
  };
  return file_relation;
};