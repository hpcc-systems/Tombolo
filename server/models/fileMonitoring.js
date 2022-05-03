'use strict';
module.exports = (sequelize, DataTypes) => {
  const fileMonitoring = sequelize.define('fileMonitoring', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    wuid: {
     type:  DataTypes.STRING,
     allowNull: false,
    },
    fileTemplateId : {
      type: DataTypes.UUID,
      allowNull : false
    },
    cluster_id:{
      type: DataTypes.UUID,
      allowNull : false
    },
    metaData : {
      type : DataTypes.JSON,
      allowNull : true
    },
  }, {paranoid: true, freezeTableName: true});
  fileMonitoring.associate = function(models) {
    // Define association here

  };
  return fileMonitoring;
};
