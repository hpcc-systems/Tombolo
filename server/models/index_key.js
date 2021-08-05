'use strict';
module.exports = (sequelize, DataTypes) => {
  const index_key = sequelize.define('index_key', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    index_id: DataTypes.STRING,
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    eclType: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  index_key.associate = function(models) {
    // associations can be defined here
  };
  return index_key;
};