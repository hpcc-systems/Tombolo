'use strict';

module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define(
    'user',
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
        allowNull: true, // For OAuth users - no password is stored
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
          isIn: [['pending', 'active', 'revoked']], // Must be one of these values
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
        defaultValue: {}, //put default value to avoid null conflicts
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      paranoid: true,

      // For paranoid tables, hooks are required to delete data from associated tables
      hooks: {
        beforeBulkDestroy: async (user, options) => {
          // Delete refresh tokens
          const RefreshTokens = sequelize.models.RefreshTokens;
          await RefreshTokens.destroy({
            where: { userId: user.where.id },
          });

          // Delete user roles
          const UserRoles = sequelize.models.UserRoles;
          await UserRoles.destroy({
            where: { userId: user.where.id },
          });

          // Delete user applications
          const user_application = sequelize.models.user_application;
          await user_application.destroy({
            where: { user_id: user.where.id },
          });

          // Delete password reset links
          const PasswordResetLinks = sequelize.models.PasswordResetLinks;
          await PasswordResetLinks.destroy({
            where: { userId: user.where.id },
          });

          // Delete verification codes
          const AccountVerificationCodes =
            sequelize.models.AccountVerificationCodes;
          await AccountVerificationCodes.destroy({
            where: { userId: user.where.id },
          });
        },
      },
    }
  );

  // Associations
  user.associate = function (models) {
    user.hasMany(models.UserRoles, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      as: 'roles',
    });

    //user to application relation
    user.hasMany(models.user_application, {
      foreignKey: 'user_id',
      as: 'applications', // Alias
      onDelete: 'CASCADE',
    });

    // User to refresh token
    user.hasMany(models.RefreshTokens, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
      hooks: true,
    });

    // User to password reset links
    user.hasMany(models.PasswordResetLinks, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
      hooks: true,
    });

    // User to verification codes
    user.hasMany(models.AccountVerificationCodes, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // User to instance settings
    user.hasOne(models.instance_settings, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'NO ACTION',
    });
    user.hasOne(models.instance_settings, {
      foreignKey: 'updatedBy',
      as: 'updater',
      onDelete: 'NO ACTION',
    });

    // User to applications
    user.hasMany(models.application, {
      foreignKey: 'creator',
      as: 'apps',
      onDelete: 'CASCADE',
    });

    // User to landing zone monitoring
    user.hasMany(models.landingZoneMonitoring, {
      foreignKey: 'createdBy',
      as: 'createdLandingZoneMonitorings',
      onDelete: 'NO ACTION',
    });

    user.hasMany(models.landingZoneMonitoring, {
      foreignKey: 'lastUpdatedBy',
      as: 'updatedLandingZoneMonitorings',
      onDelete: 'NO ACTION',
    });

    user.hasMany(models.landingZoneMonitoring, {
      foreignKey: 'approvedBy',
      as: 'approvedLandingZoneMonitorings',
      onDelete: 'NO ACTION',
    });

    // User to cluster status monitoring
    user.hasMany(models.clusterStatusMonitoring, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'NO ACTION',
    });

    user.hasMany(models.clusterStatusMonitoring, {
      foreignKey: 'lastUpdatedBy',
      as: 'updater',
      onDelete: 'NO ACTION',
    });

    user.hasMany(models.clusterStatusMonitoring, {
      foreignKey: 'approvedBy',
      as: 'approver',
      onDelete: 'NO ACTION',
    });
  };

  return user;
};
