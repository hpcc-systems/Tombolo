'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.belongsToMany(models.File, {
        constraints: false,
        foreignKeyConstraint: false,
        through: 'assets_groups',
        as: 'files',
        foreignKey: 'groupId',
        otherKey: 'assetId',
      });
      Group.belongsToMany(models.FileTemplate, {
        constraints: false,
        foreignKeyConstraint: false,
        through: 'assets_groups',
        as: 'fileTemplates',
        foreignKey: 'groupId',
        otherKey: 'assetId',
      });
      Group.belongsToMany(models.Job, {
        constraints: false,
        foreignKeyConstraint: false,
        through: 'assets_groups',
        as: 'jobs',
        foreignKey: 'groupId',
        otherKey: 'assetId',
      });
      Group.belongsToMany(models.Indexes, {
        constraints: false,
        foreignKeyConstraint: false,
        through: 'assets_groups',
        as: 'indexes',
        foreignKey: 'groupId',
        otherKey: 'assetId',
      });
      Group.belongsToMany(models.query, {
        constraints: false,
        foreignKeyConstraint: false,
        through: 'assets_groups',
        as: 'queries',
        foreignKey: 'groupId',
        otherKey: 'assetId',
      });
      // Groups.hasMany(models.Group, {
      //   as: 'child',
      //   foreignKey: {
      //     name: 'parent_group',
      //     allowNull: true
      //   }
      // });
    }
  }

  Group.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      parent_group: DataTypes.STRING,
      application_id: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: 'Group',
      tableName: 'groups',
      paranoid: true,
    }
  );

  return Group;
};
