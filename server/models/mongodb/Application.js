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
    title: DataTypes.STRING
  }, {freezeTableName: true});
  application.associate = function(models) {
    application.hasMany(models.user_application,{
      foreignKey:'application_id',
      onDelete: 'CASCADE',
      hooks: true
    });
  };
  return application;
};