'use strict';
module.exports = (sequelize, DataTypes) => {
  const application = sequelize.define('application', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    creator: DataTypes.STRING,
    visibility: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  application.associate = function(models) {
    application.hasMany(models.user_application,{
      foreignKey:'application_id',
      onDelete: 'CASCADE',
      hooks: true
    });

    application.hasMany(models.github_repo_settings,{ foreignKey:'application_id', onDelete: 'CASCADE'});
  };
  return application;
};