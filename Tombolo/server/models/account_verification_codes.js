"use strict";

module.exports = (sequelize, DataTypes) => {
  const AccountVerificationCodes = sequelize.define(
    "AccountVerificationCodes",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW + 24 * 60 * 60 * 1000,
      },
    },
    {
      tableName: "account_verification_codes",
      timestamps: true,
    }
  );

  // Associations
  AccountVerificationCodes.associate = function (models) {
    AccountVerificationCodes.belongsTo(models.user, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return AccountVerificationCodes;
};
