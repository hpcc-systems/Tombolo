'use strict';
module.exports = (sequelize, DataTypes) => {
  const job_execution = sequelize.define(
    'job_execution',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      jobId: DataTypes.UUID,
      dataflowId: DataTypes.UUID,
      applicationId: DataTypes.UUID,
      status: DataTypes.STRING,
      wuid: DataTypes.STRING,
      wu_start: DataTypes.STRING,
      wu_end: DataTypes.STRING,
      wu_duration: DataTypes.STRING,
      clusterId: DataTypes.UUID,
      manualJob_meta: DataTypes.JSON,
      jobExecutionGroupId: DataTypes.UUID,
    },
    { paranoid: true, freezeTableName: true }
  );
  job_execution.associate = function (models) {
    job_execution.belongsTo(models.job, { foreignKey: 'jobId' });
    job_execution.belongsTo(models.Dataflow, { foreignKey: 'dataflowId' }); // can be executed without dataflow, migration will allow null
    job_execution.belongsTo(models.DataflowVersion, {
      foreignKey: 'dataflowVersionId',
    }); // can be executed without dataflow, migration will allow null
    job_execution.belongsTo(models.Application, {
      foreignKey: 'applicationId',
    });
    job_execution.belongsTo(models.Cluster, { foreignKey: 'clusterId' });
  };
  return job_execution;
};
