'use strict';
module.exports = (sequelize, DataTypes) => {
  const file = sequelize.define('file', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    title: DataTypes.STRING,
    name: DataTypes.STRING(500),
    cluster_id: DataTypes.STRING,
    description: DataTypes.TEXT,
    fileType: DataTypes.STRING,
    isSuperFile: DataTypes.BOOLEAN,
    serviceURL: DataTypes.STRING,
    qualifiedPath: DataTypes.STRING,
    consumer: DataTypes.STRING,
    supplier: DataTypes.STRING,
    owner: DataTypes.STRING,
    scope: DataTypes.STRING(500),
    metaData:{
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    } 
  }, {paranoid: true, freezeTableName: true});
  file.associate = function(models) {
    file.hasMany(models.file_layout,{
      foreignKey:'file_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    file.hasMany(models.file_license,{
      foreignKey:'file_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    file.hasMany(models.file_validation,{
      foreignKey:'file_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    file.belongsTo(models.application, {
      foreignKey: 'application_id'
    });
    file.belongsToMany(models.dataflow, {
      through: 'assets_dataflows',
      as: 'dataflows',
      foreignKey: 'assetId',
      otherKey: 'dataflowId'
    });
    file.hasMany(models.consumer_object,{
      foreignKey:'consumer_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    file.belongsToMany(models.groups, {
      through: 'assets_groups',
      as: 'groups',
      foreignKey: 'assetId',
      otherKey: 'groupId'
    });
    file.belongsToMany(models.job, {
      through: 'jobfile',
      as: 'jobfiles',
      foreignKey: 'job_id',
      otherKey: 'file_id'
    });
    file.hasOne(models.visualizations, {
      foreignKey:'assetId',
      onDelete: 'CASCADE',
      hooks: true
    });
  };
  return file;
};
