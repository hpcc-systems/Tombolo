'use strict';
module.exports = (sequelize, DataTypes) => {
  const tree_connection = sequelize.define('tree_connection', {
    id: {
      primaryKey: false,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: {
      primaryKey: true,
      type: DataTypes.STRING
    },
    sourceid: {
      primaryKey: true,
      type: DataTypes.STRING,
    },
    targetid: {
      primaryKey: true,
      type: DataTypes.STRING
    },
    sourceEndPointType: DataTypes.STRING,
    targetEndPointType: DataTypes.STRING,
  }, {freezeTableName: true});
  tree_connection.associate = function(models) {

    tree_connection.hasMany(models.tree_style,{
      foreignKey:'application_id',
      onDelete: 'CASCADE',
      hooks: true
    });
  };
  return tree_connection;
};