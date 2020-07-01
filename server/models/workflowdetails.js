'use strict';
module.exports = (sequelize, DataTypes) => {
  const WorkflowDetails = sequelize.define('workflowdetails', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    workflow_id: DataTypes.STRING,
    application_id: DataTypes.STRING,
    instance_id: DataTypes.STRING,
    task: DataTypes.STRING,
    status: DataTypes.STRING,
    message: DataTypes.TEXT,
    wuid: DataTypes.TEXT,
    wu_start: DataTypes.TEXT,
    wu_end: DataTypes.TEXT,
    wu_duration: DataTypes.TEXT
  }, {});
  WorkflowDetails.associate = function(models) {
    // associations can be defined here
  };
  return WorkflowDetails;
};