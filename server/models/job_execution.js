'use strict';
module.exports = (sequelize, DataTypes) => {
  const job_execution = sequelize.define('job_execution', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    jobId: DataTypes.UUID,
    dataflowId: DataTypes.UUID,
    applicationId: DataTypes.UUID,
    status: DataTypes.STRING,
    wuid: DataTypes.STRING,
    wu_start: DataTypes.STRING,
    wu_end: DataTypes.STRING,
    wu_duration: DataTypes.STRING
  }, {freezeTableName: true});
  job_execution.associate = function(models) {
  };
  return job_execution;
};