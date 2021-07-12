'use strict';
module.exports = (sequelize, DataTypes) => {
  const consumer_object = sequelize.define('consumer_object', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    consumer_id: DataTypes.STRING,
    object_id: DataTypes.STRING,
    object_type: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  consumer_object.associate = function(models) {
    // associations can be defined here
  };
  return consumer_object;
};