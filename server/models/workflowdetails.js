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
    wuid: DataTypes.STRING,
    wu_start: DataTypes.STRING,
    wu_end: DataTypes.STRING,
    wu_duration: DataTypes.STRING,
    owner: DataTypes.STRING,
    jobName: DataTypes.STRING
  }, {});
  WorkflowDetails.associate = function(models) {
    // associations can be defined here
  };
  return WorkflowDetails;
};