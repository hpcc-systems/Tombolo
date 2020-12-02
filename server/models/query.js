'use strict';
module.exports = (sequelize, DataTypes) => {
  const query = sequelize.define('query', {
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
    description: DataTypes.STRING,
    url: DataTypes.STRING,
    gitRepo: DataTypes.STRING,
    primaryService: DataTypes.STRING,
    backupService: DataTypes.STRING,
    type: DataTypes.STRING
  }, {freezeTableName: true});
  query.associate = function(models) {
    query.hasMany(models.query_field,{
      foreignKey:'query_id',
      onDelete: 'CASCADE',
      hooks: true
    });
    query.belongsTo(models.application, {
      foreignKey: 'application_id'
    });
    query.belongsTo(models.groups);
  };
  return query;
};