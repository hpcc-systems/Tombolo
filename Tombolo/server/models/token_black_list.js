"use strict";

module.exports = (sequelize, DataTypes) => {
  const TokenBlackList = sequelize.define(
    "TokenBlackList",
    {
      id: {
        primaryKey: true,
        type: DataTypes.STRING,
        allowNull: false,
      },
      exp: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: "token_black_list",
    }
  );

  return TokenBlackList;
};

1, 728, 662, 207, 335;
