'use strict';
module.exports = (sequelize, DataTypes) => {
  const application = sequelize.define(
    'application',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
      creator: DataTypes.STRING,
      visibility: DataTypes.STRING,
    },
    { paranoid: true, freezeTableName: true }
  );

  application.associate = function (models) {
    /* USER_APPLICATION */
    application.hasMany(models.user_application, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
      hooks: true,
    });
    /* VISUALIZATIONS */
    application.hasMany(models.visualizations, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* GITHUB SETTINGS */
    application.hasMany(models.github_repo_settings, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* JOB EXECUTION */
    application.hasMany(models.job_execution, {
      foreignKey: "applicationId",
      onDelete: "CASCADE",
    });
    /* DATAFLOW */
    application.hasMany(models.dataflow, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* INDEX */
    application.hasMany(models.indexes, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* QUERY */
    application.hasMany(models.query, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    application.hasMany(models.query_field, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* JOB */
    application.hasMany(models.job, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    application.hasMany(models.jobparam, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* REPORT */
    application.hasMany(models.report, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* FILE */
    application.hasMany(models.file, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    application.hasMany(models.file_validation, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* FILE TEMPLATE*/
    application.hasMany(models.fileTemplate, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    application.hasMany(models.fileTemplateLayout, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* FILE MONITORING */
    application.hasMany(models.fileMonitoring, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
    /* FILE MONITORING NOTIFICATION*/
    application.hasMany(models.monitoring_notifications, {
      foreignKey: "application_id",
      onDelete: "CASCADE",
    });
  };


  return application;
};
