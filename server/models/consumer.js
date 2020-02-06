'use strict';
module.exports = (sequelize, DataTypes) => {
  const consumer = sequelize.define('consumer', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    contact_name: DataTypes.STRING,
    contact_email: DataTypes.STRING,
    ad_group: DataTypes.STRING,
    assetType: DataTypes.STRING
  }, {freezeTableName: true});
  consumer.associate = function(models) {
  };
  return consumer;
};