'use strict';
module.exports = (sequelize, DataTypes) => {
  const query = sequelize.define(
    'query',
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
      url: DataTypes.STRING,
      gitRepo: DataTypes.STRING,
      primaryService: DataTypes.STRING,
      backupService: DataTypes.STRING,
      type: DataTypes.STRING,
    },
    { paranoid: true, freezeTableName: true }
  );
  query.associate = function (models) {
    query.hasMany(models.query_field, {
      constraints: false,
      foreignKeyConstraint: false,
      foreignKey: 'query_id',
      onDelete: 'CASCADE',
      hooks: true,
    });

    query.belongsTo(models.Application, {
      foreignKey: 'application_id',
    });
    query.belongsToMany(models.Group, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'groups',
      foreignKey: 'assetId',
      otherKey: 'groupId',
    });
  };
  return query;
};
