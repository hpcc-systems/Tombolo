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
    thor_host: DataTypes.STRING,
    thor_port: DataTypes.STRING,
    roxie_host: DataTypes.STRING,
    roxie_port: DataTypes.STRING,
    username: DataTypes.STRING,
    hash: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  cluster.associate = function(models) {
    // associations can be defined here
  };
  return cluster;
};