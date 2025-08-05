'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FileTemplate extends Model {
    static associate(models) {
      FileTemplate.hasOne(models.FileTemplateLayout, {
        foreignKey: 'fileTemplate_id',
        onDelete: 'CASCADE',
        hooks: true,
      });

      FileTemplate.hasMany(models.FileMonitoring, {
        foreignKey: 'fileTemplateId',
        onDelete: 'CASCADE',
      });

      FileTemplate.hasMany(models.FileTemplateLayout, {
        foreignKey: 'fileTemplate_id',
        onDelete: 'CASCADE',
      });

      FileTemplate.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });

      FileTemplate.belongsTo(models.Cluster, { foreignKey: 'cluster_id' });
    }
  }

  FileTemplate.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileNamePattern: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      searchString: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sampleLayoutFile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cluster_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'FileTemplate',
      tableName: 'file_templates',
      paranoid: true,
    }
  );

  return FileTemplate;
};
