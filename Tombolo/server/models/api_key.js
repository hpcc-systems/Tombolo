"use strict";
module.exports = (sequelize, DataTypes) => {
  const bcrypt = require("bcryptjs");
  const api_key = sequelize.define(
    "api_key",
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      application_id: DataTypes.UUID,
      apiKey: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: DataTypes.STRING,
      expirationDate: DataTypes.BIGINT,
      expired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      metaData: DataTypes.JSON,
    },
    {
      freezeTableName: true,
      paranoid: true,
      //hooks to hash key once inserted
      hooks: {
        beforeCreate: async (api_key) => {
          if (api_key.apiKey) {
            const salt = await bcrypt.genSaltSync(10, "a");
            api_key.apiKey = bcrypt.hashSync(api_key.apiKey, salt);
          }
        },
        beforeUpdate: async (api_key) => {
          if (api_key.apiKey) {
            const salt = await bcrypt.genSaltSync(10, "a");
            api_key.apiKey = bcrypt.hashSync(api_key.apiKey, salt);
          }
        },
      },
      instanceMethods: {
        validKey: (apiKey) => {
          return bcrypt.compareSync(apiKey, this.apiKey);
        },
      },
    }
  );
  api_key.associate = function (models) {
    api_key.belongsTo(models.application, {
      foreignKey: "application_id",
    });
  };

  api_key.prototype.validKey = async function (apiKey) {
    return bcrypt.compareSync(apiKey, this.apiKey);
  };

  return api_key;
};
