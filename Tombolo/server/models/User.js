'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = sequelize => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.UserRoles, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'roles',
      });

      User.hasMany(models.user_application, {
        foreignKey: 'user_id',
        as: 'applications',
        onDelete: 'CASCADE',
      });

      User.hasMany(models.RefreshToken, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        hooks: true,
      });

      User.hasMany(models.PasswordResetLink, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        hooks: true,
      });

      User.hasMany(models.AccountVerificationCode, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      User.hasOne(models.InstanceSetting, {
        foreignKey: 'createdBy',
        as: 'creator',
        onDelete: 'NO ACTION',
      });

      User.hasOne(models.InstanceSetting, {
        foreignKey: 'updatedBy',
        as: 'updater',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.Application, {
        foreignKey: 'creator',
        as: 'apps',
        onDelete: 'CASCADE',
      });

      User.hasMany(models.LandingZoneMonitoring, {
        foreignKey: 'createdBy',
        as: 'createdLandingZoneMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.LandingZoneMonitoring, {
        foreignKey: 'lastUpdatedBy',
        as: 'updatedLandingZoneMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.LandingZoneMonitoring, {
        foreignKey: 'approvedBy',
        as: 'approvedLandingZoneMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.LandingZoneMonitoring, {
        foreignKey: 'deletedBy',
        as: 'deletedLandingZoneMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.CostMonitoring, {
        foreignKey: 'approvedBy',
        as: 'approvedCostMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.CostMonitoring, {
        foreignKey: 'createdBy',
        as: 'createdCostMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.CostMonitoring, {
        foreignKey: 'lastUpdatedBy',
        as: 'updatedCostMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.CostMonitoring, {
        foreignKey: 'deletedBy',
        as: 'deletedCostMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.JobMonitoring, {
        foreignKey: 'approvedBy',
        as: 'approvedJobMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.JobMonitoring, {
        foreignKey: 'createdBy',
        as: 'createdJobMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.JobMonitoring, {
        foreignKey: 'lastUpdatedBy',
        as: 'updatedJobMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.JobMonitoring, {
        foreignKey: 'deletedBy',
        as: 'deletedJobMonitorings',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.ClusterMonitoring, {
        foreignKey: 'createdBy',
        as: 'clusterMonitoringCreator',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.ClusterMonitoring, {
        foreignKey: 'lastUpdatedBy',
        as: 'clusterMonitoringUpdater',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.ClusterMonitoring, {
        foreignKey: 'approvedBy',
        as: 'clusterMonitoringApprover',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.AsrDomain, {
        foreignKey: 'createdBy',
        as: 'asrDomainCreator',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.AsrDomain, {
        foreignKey: 'createdBy',
        as: 'asrDomainCreator',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.AsrDomain, {
        foreignKey: 'updatedBy',
        as: 'asrDomainUpdater',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.AsrDomain, {
        foreignKey: 'updatedBy',
        as: 'asrDomainDeleter',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.AsrProduct, {
        foreignKey: 'createdBy',
        as: 'asrProductCreator',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.AsrProduct, {
        foreignKey: 'updatedBy',
        as: 'asrProductUpdater',
        onDelete: 'NO ACTION',
      });

      User.hasMany(models.AsrProduct, {
        foreignKey: 'updatedBy',
        as: 'asrProductDeleter',
        onDelete: 'NO ACTION',
      });
    }
  }

  User.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      hash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      registrationMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['traditional', 'azure']],
        },
      },
      verifiedUser: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      registrationStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'active', 'revoked']],
        },
      },
      forcePasswordReset: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      passwordExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      loginAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      accountLocked: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          isLocked: false,
          lockedReason: [],
        },
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastAccessedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metaData: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      paranoid: true,
      hooks: {
        // eslint-disable-next-line no-unused-vars
        beforeBulkDestroy: async (user, options) => {
          const RefreshToken = sequelize.models.RefreshToken;
          await RefreshToken.destroy({
            where: { userId: user.where.id },
          });

          const UserRoles = sequelize.models.UserRoles;
          await UserRoles.destroy({
            where: { userId: user.where.id },
          });

          const user_application = sequelize.models.user_application;
          await user_application.destroy({
            where: { user_id: user.where.id },
          });

          const PasswordResetLink = sequelize.models.PasswordResetLink;
          await PasswordResetLink.destroy({
            where: { userId: user.where.id },
          });

          const AccountVerificationCodes =
            sequelize.models.AccountVerificationCode;
          await AccountVerificationCodes.destroy({
            where: { userId: user.where.id },
          });
        },
      },
    }
  );

  return User;
};
