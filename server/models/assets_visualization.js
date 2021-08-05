'use strict';
module.exports = (sequelize, DataTypes) => {
  const assets_visualization = sequelize.define('assets_visualization', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    assetId: DataTypes.UUID,
    url: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  assets_visualization.associate = function(models) {
  };
  return assets_visualization;
};