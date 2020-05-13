'use strict';
module.exports = (sequelize, DataTypes) => {
  const Workflow = sequelize.define('workflows', {
  	id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    application_id: DataTypes.STRING,
    dataflowId: DataTypes.STRING,
    status: DataTypes.STRING
  }, {freezeTableName: true});
  Workflow.associate = function(models) {
    // associations can be defined here
    Workflow.hasMany(models.workflowdetails,{
      foreignKey:'workflow_id',
      onDelete: 'CASCADE',
      hooks: true
    });
  };
  return Workflow;
};