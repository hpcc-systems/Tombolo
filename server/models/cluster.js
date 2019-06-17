'use strict';
module.exports = (sequelize, DataTypes) => {
  const cluster = sequelize.define('cluster', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    name: DataTypes.STRING,
    host_url: DataTypes.STRING,
    port: DataTypes.STRING,
    username: DataTypes.STRING,
    hash: DataTypes.STRING
  }, {freezeTableName: true});
  cluster.associate = function(models) {
    // associations can be defined here
  };
  return cluster;
};