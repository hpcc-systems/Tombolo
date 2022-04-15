'use strict';
module.exports = (sequelize, DataTypes) => {
  const fileTemplate_license = sequelize.define('fileTemplate_license', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: {
      type : DataTypes.UUID,
      allowNull : false,
    },
    fileTemplate_id: {
      type : DataTypes.UUID,
      allowNull : false
    },
    license_id : {
      type : DataTypes.UUID,
      allowNull : false
    },
    name : {
      type : DataTypes.STRING,
    },
    url: {
      type : DataTypes.STRING,
    }
  }, {paranoid: true, freezeTableName: true});
  fileTemplate_license.associate = function(models) {
    fileTemplate_license.belongsTo(models.fileTemplate, {
      foreignKey: 'fileTemplate_id'
    });
  };
  return fileTemplate_license;
};