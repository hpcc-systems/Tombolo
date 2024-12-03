"use strict";
module.exports = (sequelize, DataTypes) => {
  const PasswordResetLinks = sequelize.define(
    "PasswordResetLinks",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      resetLink: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "password_reset_links",
      freezeTableName: true,
      timestamps: true,
    }
  );

  // Associations
  PasswordResetLinks.associate = function (models) {
    PasswordResetLinks.belongsTo(models.user, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      hooks: true,
    });
  };

  return PasswordResetLinks;
};
