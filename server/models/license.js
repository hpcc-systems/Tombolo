'use strict';
module.exports = (sequelize, DataTypes) => {
  const license = sequelize.define('license', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    name: DataTypes.STRING,
    url: DataTypes.STRING
  }, {freezeTableName: true});
  license.associate = function(models) {
    // associations can be defined here
  };
  return license;
};