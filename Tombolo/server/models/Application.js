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
      this.hasMany(models.github_repo_settings, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* JOB EXECUTION */
      this.hasMany(models.job_execution, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
      });

      /* DATAFLOW */
      this.hasMany(models.dataflow, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* INDEX */
      this.hasMany(models.indexes, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* QUERY */
      this.hasMany(models.query, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.query_field, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* JOB */
      this.hasMany(models.job, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.jobparam, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* REPORT */
      this.hasMany(models.report, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* FILE */
      this.hasMany(models.file, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.file_validation, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* FILE TEMPLATE */
      this.hasMany(models.fileTemplate, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.fileTemplateLayout, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* FILE MONITORING */
      this.hasMany(models.fileMonitoring, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* FILE MONITORING NOTIFICATION */
      this.hasMany(models.monitoring_notifications, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      this.hasMany(models.integration_mapping, {
        foreignKey: 'application_id',
        onDelete: 'CASCADE',
      });

      /* JOB MONITORING DATA */
      this.hasMany(models.jobMonitoring_Data, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
      });

      /* JOB MONITORING DATA ARCHIVE */
      this.hasMany(models.jobMonitoring_Data_Archive, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
      });

      /* LANDING ZONE MONITORING */
      this.hasMany(models.landingZoneMonitoring, {
        foreignKey: 'applicationId',
        onDelete: 'CASCADE',
      });

      /* User relationship */
      this.belongsTo(models.user, {
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
