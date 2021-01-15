'use strict';
module.exports = (sequelize, DataTypes) => {
  const assets_dataflows = sequelize.define('assets_dataflows', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    assetId: DataTypes.UUID,
    dataflowId: DataTypes.UUID,
  }, {freezeTableName: true});

  return assets_dataflows;
};