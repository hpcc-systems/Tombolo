// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class JobExecution extends Model {
//     static associate(models) {
//       JobExecution.belongsTo(models.Job, { foreignKey: 'jobId' });
//       // JobExecution.belongsTo(models.Dataflow, { foreignKey: 'dataflowId' });
//       // JobExecution.belongsTo(models.DataflowVersion, {
//       //   foreignKey: 'dataflowVersionId',
//       // });
//       JobExecution.belongsTo(models.Application, {
//         foreignKey: 'applicationId',
//       });
//       JobExecution.belongsTo(models.Cluster, { foreignKey: 'clusterId' });
//     }
//   }
//
//   JobExecution.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       jobId: DataTypes.UUID,
//       dataflowId: DataTypes.UUID,
//       applicationId: DataTypes.UUID,
//       status: DataTypes.STRING,
//       wuid: DataTypes.STRING,
//       wu_start: DataTypes.STRING,
//       wu_end: DataTypes.STRING,
//       wu_duration: DataTypes.STRING,
//       clusterId: DataTypes.UUID,
//       manualJob_meta: DataTypes.JSON,
//       jobExecutionGroupId: DataTypes.UUID,
//     },
//     {
//       sequelize,
//       modelName: 'JobExecution',
//       tableName: 'job_executions',
//       paranoid: true,
//     }
//   );
//
//   return JobExecution;
// };
