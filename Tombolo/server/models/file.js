'use strict';
module.exports = (sequelize, DataTypes) => {
  const file = sequelize.define(
    'file',
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
      name: DataTypes.STRING(500),
      cluster_id: DataTypes.UUID,
      description: DataTypes.TEXT,
      fileType: DataTypes.STRING,
      isSuperFile: DataTypes.BOOLEAN,
      serviceURL: DataTypes.STRING,
      qualifiedPath: DataTypes.STRING,
      consumer: DataTypes.STRING,
      supplier: DataTypes.STRING,
      owner: DataTypes.STRING,
      scope: DataTypes.STRING(500),
      metaData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
    },
    { paranoid: true, freezeTableName: true }
  );
  file.associate = function (models) {
    file.hasMany(models.file_validation, {
      foreignKey: 'file_id',
      onDelete: 'CASCADE',
    });
    file.hasMany(models.indexes, {
      foreignKey: 'parentFileId',
      onDelete: 'CASCADE',
    });
    file.hasMany(models.ConsumerObject, {
      foreignKey: 'consumer_id',
      onDelete: 'CASCADE',
    });

    file.belongsTo(models.Application, { foreignKey: 'application_id' });
    file.belongsToMany(models.groups, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'groups',
      foreignKey: 'assetId',
      otherKey: 'groupId',
    });

    file.belongsToMany(models.job, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'jobfile',
      foreignKey: 'file_id',
      otherKey: 'job_id',
    });
  };
  return file;
};
