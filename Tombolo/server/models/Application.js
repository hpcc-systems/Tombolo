'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = sequelize => {
  class Application extends Model {
    static associate(models) {
      /* USER_APPLICATION */
      this.hasMany(models.user_application, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
        hooks: true,
      });

      /* GITHUB SETTINGS */
      this.hasMany(models.GithubRepoSetting, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* JOB EXECUTION */
      this.hasMany(models.JobExecution, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
      });

      /* DATAFLOW */
      this.hasMany(models.Dataflow, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* INDEX */
      this.hasMany(models.Indexes, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* QUERY */
      this.hasMany(models.Query, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.QueryField, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* JOB */
      this.hasMany(models.Job, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.JobParam, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* REPORT */
      this.hasMany(models.Report, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* FILE */
      this.hasMany(models.File, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.FileValidation, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* FILE TEMPLATE */
      this.hasMany(models.FileTemplate, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.FileTemplateLayout, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* FILE MONITORING */
      this.hasMany(models.FileMonitoring, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* FILE MONITORING NOTIFICATION */
      this.hasMany(models.MonitoringNotification, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.IntegrationMapping, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* JOB MONITORING DATA */
      this.hasMany(models.JobMonitoringData, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
      });

      /* JOB MONITORING DATA ARCHIVE */
      this.hasMany(models.JobMonitoringDataArchive, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
      });

      /* LANDING ZONE MONITORING */
      this.hasMany(models.LandingZoneMonitoring, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
      });

      /* User relationship */
      this.belongsTo(models.User, {
        foreignKey: 'creator',
        as: 'application_creator',
        onDelete: 'CASCADE',
      });
    }
  }

  Application.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      creator: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      visibility: {
        type: DataTypes.ENUM('Public', 'Private'),
        allowNull: false,
        defaultValue: 'Private',
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
      modelName: 'Application',
      tableName: 'applications',
      paranoid: true,
    }
  );

  return Application;
};
