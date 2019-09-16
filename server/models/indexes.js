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
    description: DataTypes.STRING,
    primaryService: DataTypes.STRING,
    backupService: DataTypes.STRING,
    qualifiedPath: DataTypes.STRING,
    parentFileId: DataTypes.STRING,
    registrationTime: DataTypes.STRING,
    updatedDateTime: DataTypes.STRING,
    dataLastUpdatedTime: DataTypes.STRING
  }, {freezeTableName: true});
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
  };
  return indexes;
};