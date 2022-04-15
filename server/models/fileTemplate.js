'use strict';
module.exports = (sequelize, DataTypes) => {
  const fileTemplate = sequelize.define('fileTemplate', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: {
     type:  DataTypes.STRING,
     allowNull: false,
    },
    title:{
      type: DataTypes.STRING,
      allowNull : false
    },
    fileNamePattern : {
      type: DataTypes.STRING,
      allowNull: false
    }, 
    searchString : {
      type: DataTypes.STRING,
      allowNull : false
    },
    sampleLayoutFile : {
      type : DataTypes.STRING,
      allowNull : false
    },
    cluster_id: {
      type : DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
  }, {paranoid: true, freezeTableName: true});
  fileTemplate.associate = function(models) {
    // Define association here
     fileTemplate.hasOne(models.fileTemplateLayout,{
      foreignKey:'fileTemplate_id',
      onDelete: 'CASCADE',
      hooks: true
    });
  };
  return fileTemplate;
};
