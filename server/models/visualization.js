'use strict';
module.exports = (sequelize, DataTypes) => {
  const visualization = sequelize.define('visualizations', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    assetId: DataTypes.UUIDV4,
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    application_id: DataTypes.UUIDV4,
    type: DataTypes.STRING,
    url: DataTypes.STRING,
    clusterId: DataTypes.UUIDV4
  }, {paranoid: true, freezeTableName: true});
  visualization.associate = function(models) {    
    visualization.belongsToMany(models.groups, {
      through: 'assets_groups',
      as: 'groups',
      foreignKey: 'assetId',
      otherKey: 'groupId'
    });
  };
  return visualization;
};