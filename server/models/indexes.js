'use strict';
module.exports = (sequelize, DataTypes) => {
  const indexes = sequelize.define('indexes', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    title: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    primaryService: DataTypes.STRING,
    backupService: DataTypes.STRING,
    qualifiedPath: DataTypes.STRING,
    parentFileId: DataTypes.STRING,
    registrationTime: DataTypes.STRING,
    updatedDateTime: DataTypes.STRING,
    dataLastUpdatedTime: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  indexes.associate = function(models) {
    indexes.hasMany(models.index_key,{
      foreignKey:'index_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    indexes.hasMany(models.index_payload,{
      foreignKey:'index_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    indexes.belongsTo(models.application, {
      foreignKey: 'application_id'
    });
    indexes.belongsToMany(models.dataflow, {
      through: 'assets_dataflows',
      as: 'dataflows',
      foreignKey: 'assetId',
      otherKey: 'dataflowId'
    });
    indexes.belongsTo(models.file, {
      foreignKey: 'parentFileId'
    });
    indexes.belongsToMany(models.groups, {
      through: 'assets_groups',
      as: 'groups',
      foreignKey: 'assetId',
      otherKey: 'groupId'
    })
  };
  return indexes;
};