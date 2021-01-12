'use strict';
module.exports = (sequelize, DataTypes) => {
  const groups = sequelize.define('groups', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    parent_group: DataTypes.UUIDV4,
    application_id: DataTypes.UUIDV4
  }, {freezeTableName: true});
  groups.associate = function(models) {
    groups.hasMany(models.file);
    groups.hasMany(models.job);
    groups.hasMany(models.indexes);
    groups.hasMany(models.query);
    groups.hasMany(models.groups, {
      as: 'child',
      foreignKey: {
        name: 'parent_group',
        allowNull: true
      }
    });
  };
  return groups;
};