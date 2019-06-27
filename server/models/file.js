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
    cluster_id: DataTypes.STRING,
    description: DataTypes.STRING,
    fileType: DataTypes.STRING,
    isSuperFile: DataTypes.STRING,
    primaryService: DataTypes.STRING,
    backupService: DataTypes.STRING,
    qualifiedPath: DataTypes.STRING
  }, {freezeTableName: true});
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
    file.hasMany(models.file_relation,{
      foreignKey:'file_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    file.hasMany(models.file_field_relation,{
      foreignKey:'file_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    file.hasMany(models.file_validation,{
      foreignKey:'file_id',
      onDelete: 'CASCADE',
      hooks: true
    });
  };
  return file;
};