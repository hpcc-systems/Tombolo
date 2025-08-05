'use strict';
module.exports = (sequelize, DataTypes) => {
  const indexes = sequelize.define(
    'indexes',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      application_id: DataTypes.UUID,
      title: DataTypes.STRING,
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      primaryService: DataTypes.STRING,
      backupService: DataTypes.STRING,
      qualifiedPath: DataTypes.STRING,
      parentFileId: {
        type: DataTypes.UUID,
        defaultValue: null,
      },
      registrationTime: DataTypes.STRING,
      metaData: DataTypes.JSON,
      updatedDateTime: DataTypes.STRING,
      dataLastUpdatedTime: DataTypes.STRING,
    },
    { paranoid: true, freezeTableName: true }
  );
  indexes.associate = function (models) {
    indexes.hasMany(models.index_key, {
      foreignKey: 'index_id',
      onDelete: 'CASCADE',
      hooks: true,
    });
    indexes.hasMany(models.index_payload, {
      foreignKey: 'index_id',
      onDelete: 'CASCADE',
      hooks: true,
    });
    indexes.belongsTo(models.Application, {
      foreignKey: 'application_id',
    });

    indexes.belongsTo(models.File, {
      foreignKey: 'parentFileId',
    });
    indexes.belongsToMany(models.groups, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'groups',
      foreignKey: 'assetId',
      otherKey: 'groupId',
    });
  };
  return indexes;
};
