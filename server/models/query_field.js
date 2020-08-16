'use strict';
module.exports = (sequelize, DataTypes) => {
  const query_field = sequelize.define('query_field', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    query_id: DataTypes.STRING,
    application_id: DataTypes.STRING,
    field_type: DataTypes.STRING,
    name: DataTypes.STRING,
    type: DataTypes.STRING
  }, {freezeTableName: true});
  query_field.associate = function(models) {
    // associations can be defined here
  };
  return query_field;
};