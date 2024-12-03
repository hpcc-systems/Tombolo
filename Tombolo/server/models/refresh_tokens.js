// Model for storing refresh token [ id - uuid , userId - uuid, token - string, device Info - json, timestamp, paranoid, freeze table name ]
"use strict";
module.exports = (sequelize, DataTypes) => {
    const RefreshTokens = sequelize.define("RefreshTokens", {
        id: {
            primaryKey: true,
            type: DataTypes.UUID,
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        deviceInfo: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        iat:{
            type: DataTypes.DATE,
            allowNull: false,
        },
        exp: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        revoked:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        revokedAt:{
            type: DataTypes.DATE,
            allowNull: true,
        },
        metaData: {
            type: DataTypes.JSON,
            allowNull: true,
        }
    },
        {
        tableName: 'refresh_tokens',
        freezeTableName: true,
        timeStamps: true,
        paranoid: true
        }
    );
    // Associations
    RefreshTokens.associate = function(models) {
        RefreshTokens.belongsTo(models.user, {
            foreignKey: "userId",
            onDelete: "CASCADE",
            hooks: true,
        });
    };

    return RefreshTokens;
};