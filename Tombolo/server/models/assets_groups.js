'use strict';
module.exports = (sequelize, DataTypes) => {
  const assets_groups = sequelize.define('assets_groups', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    assetId: DataTypes.UUID,
    groupId: DataTypes.INTEGER
  }, {paranoid: true, freezeTableName: true});
  return assets_groups;
};