'use strict';
module.exports = (sequelize, DataTypes) => {
  const file_license = sequelize.define('file_license', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    file_id: DataTypes.STRING,
    name: DataTypes.STRING,
    url: DataTypes.STRING
  }, {freezeTableName: true});
  file_license.associate = function(models) {
  };
  return file_license;
};