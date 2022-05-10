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
    assetId: DataTypes.UUID,
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    application_id: DataTypes.UUID,
    type: DataTypes.STRING,
    url: DataTypes.STRING,
    clusterId: DataTypes.UUID
  }, {paranoid: true, freezeTableName: true});
  visualization.associate = function(models) {    
    visualization.belongsToMany(models.groups, {
      constraints: false,
      foreignKeyConstraint:false,
      through: 'assets_groups',
      as: 'groups',
      foreignKey: 'assetId',
      otherKey: 'groupId'
    });

    visualization.belongsTo(models.file, { foreignKey: 'assetId' });
    visualization.belongsTo(models.cluster, { foreignKey: 'clusterId' });
    visualization.belongsTo(models.application, { foreignKey: 'application_id' });

  };
  return visualization;
};