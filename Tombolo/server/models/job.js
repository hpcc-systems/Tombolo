'use strict';
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const job = sequelize.define(
    'job',
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
    },
    { paranoid: true, freezeTableName: true }
  );
  job.associate = function (models) {
    job.belongsToMany(models.File, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'jobfile',
      foreignKey: 'job_id',
      otherKey: 'file_id',
    });

    job.hasMany(models.job_execution, {
      foreignKey: 'jobId',
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    });
    job.hasMany(models.jobparam, {
      foreignKey: 'job_id',
      onDelete: 'CASCADE',
      hooks: true,
    });
    job.belongsTo(models.Cluster, {
      foreignKey: 'cluster_id',
    });
    job.belongsTo(models.Application, {
      foreignKey: 'application_id',
    });
    job.belongsToMany(models.groups, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'groups',
      foreignKey: 'assetId',
      otherKey: 'groupId',
    });
  };
  return job;
};
