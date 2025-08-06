'use strict';
module.exports = (sequelize, DataTypes) => {
  const groups = sequelize.define(
    'groups',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      parent_group: DataTypes.STRING,
      application_id: DataTypes.UUID,
    },
    { paranoid: true, freezeTableName: true }
  );
  groups.associate = function (models) {
    groups.belongsToMany(models.File, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'files',
      foreignKey: 'groupId',
      otherKey: 'assetId',
    });
    groups.belongsToMany(models.fileTemplate, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'fileTemplates',
      foreignKey: 'groupId',
      otherKey: 'assetId',
    });
    groups.belongsToMany(models.job, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'jobs',
      foreignKey: 'groupId',
      otherKey: 'assetId',
    });
    groups.belongsToMany(models.indexes, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'indexes',
      foreignKey: 'groupId',
      otherKey: 'assetId',
    });
    groups.belongsToMany(models.query, {
      constraints: false,
      foreignKeyConstraint: false,
      through: 'assets_groups',
      as: 'queries',
      foreignKey: 'groupId',
      otherKey: 'assetId',
    });

    // groups.hasMany(models.groups, {
    //   as: 'child',
    //   foreignKey: {
    //     name: 'parent_group',
    //     allowNull: true
    //   }
    // });
  };
  return groups;
};
