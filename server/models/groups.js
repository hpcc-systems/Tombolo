'use strict';
module.exports = (sequelize, DataTypes) => {
  const groups = sequelize.define('groups', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    parent_group: DataTypes.UUIDV4,
    application_id: DataTypes.UUIDV4
  }, {paranoid: true, freezeTableName: true});
  groups.associate = function(models) {
    groups.belongsToMany(models.file, {
      through: 'assets_groups',
      as: 'files',
      foreignKey: 'groupId',
      otherKey: 'assetId'
    });
    groups.belongsToMany(models.job, {
      through: 'assets_groups',
      as: 'jobs',
      foreignKey: 'groupId',
      otherKey: 'assetId'
    });
    groups.belongsToMany(models.indexes, {
      through: 'assets_groups',
      as: 'indexes',
      foreignKey: 'groupId',
      otherKey: 'assetId'
    });
    groups.belongsToMany(models.query, {
      through: 'assets_groups',
      as: 'queries',
      foreignKey: 'groupId',
      otherKey: 'assetId'
    });
    groups.belongsToMany(models.visualizations, {
      through: 'assets_groups',
      as: 'visualizations',
      foreignKey: 'groupId',
      otherKey: 'assetId'
    });
    groups.hasMany(models.groups, {
      as: 'child',
      foreignKey: {
        name: 'parent_group',
        allowNull: true
      }
    });
  };
  return groups;
};