'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Query extends Model {
    static associate(models) {
      Query.hasMany(models.QueryField, {
        constraints: false,
        foreignKeyConstraint: false,
        foreignKey: 'query_id',
        onDelete: 'CASCADE',
        hooks: true,
      });

      Query.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });

      Query.belongsToMany(models.Group, {
        constraints: false,
        foreignKeyConstraint: false,
        through: 'assets_groups',
        as: 'groups',
        foreignKey: 'assetId',
        otherKey: 'groupId',
      });
    }
  }

  Query.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: DataTypes.UUID,
      title: DataTypes.STRING,
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      url: DataTypes.STRING,
      gitRepo: DataTypes.STRING,
      primaryService: DataTypes.STRING,
      backupService: DataTypes.STRING,
      type: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Query',
      tableName: 'queries',
      paranoid: true,
    }
  );

  return Query;
};
