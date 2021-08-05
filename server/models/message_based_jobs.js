'use strict';
module.exports = (sequelize, DataTypes) => {
  const message_based_jobs = sequelize.define('message_based_jobs', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    applicationId: DataTypes.UUID,
    jobId: DataTypes.UUID,
    dataflowId: DataTypes.UUID
  }, {paranoid: true, freezeTableName: true});
  message_based_jobs.associate = function(models) {
    // associations can be defined here
  };
  return message_based_jobs;
};