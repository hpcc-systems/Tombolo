'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Job extends Model {
    static associate(models) {
      Job.belongsToMany(models.File, {
        constraints: false,
        foreignKeyConstraint: false,
        through: 'job_files',
        foreignKey: 'job_id',
        otherKey: 'file_id',
      });

      Job.hasMany(models.JobExecution, {
        foreignKey: 'jobId',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      });

      Job.hasMany(models.JobParam, {
        foreignKey: 'job_id',
        onDelete: 'CASCADE',
        hooks: true,
      });

      Job.belongsTo(models.Cluster, {
        foreignKey: 'cluster_id',
      });

      Job.belongsTo(models.Application, {
        foreignKey: 'application_id',
      });

      Job.belongsToMany(models.Group, {
        constraints: false,
        foreignKeyConstraint: false,
        through: 'assets_groups',
        as: 'groups',
        foreignKey: 'assetId',
        otherKey: 'groupId',
      });
    }
  }

  Job.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: DataTypes.UUID,
      author: DataTypes.STRING,
      contact: DataTypes.STRING,
      description: DataTypes.TEXT,
      ecl: DataTypes.TEXT,
      entryBWR: DataTypes.STRING,
      gitRepo: DataTypes.STRING,
      jobType: DataTypes.STRING,
      title: DataTypes.STRING,
      name: DataTypes.STRING,
      cluster_id: DataTypes.UUID,
      scriptPath: DataTypes.STRING,
      sprayFileName: DataTypes.STRING,
      sprayDropZone: DataTypes.STRING,
      sprayedFileScope: DataTypes.STRING,
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Job',
      tableName: 'jobs',
      paranoid: true,
    }
  );

  return Job;
};
