// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class Dataflow extends Model {
//     static associate(models) {
//       Dataflow.hasOne(models.DataflowClusterCredential, {
//         foreignKey: 'dataflow_id',
//       });
//       Dataflow.hasMany(models.JobExecution, {
//         foreignKey: 'dataflowId',
//         onDelete: 'NO ACTION',
//         onUpdate: 'NO ACTION',
//       });
//       Dataflow.hasMany(models.DataflowVersion, {
//         foreignKey: 'dataflowId',
//         onDelete: 'CASCADE',
//         onUpdate: 'CASCADE',
//       });
//       Dataflow.belongsTo(models.Application, { foreignKey: 'application_id' });
//       Dataflow.belongsTo(models.Cluster, { foreignKey: 'clusterId' });
//     }
//   }
//
//   Dataflow.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       graph: DataTypes.JSON,
//       application_id: DataTypes.UUID,
//       title: DataTypes.STRING,
//       description: DataTypes.TEXT,
//       input: DataTypes.STRING,
//       output: DataTypes.STRING,
//       clusterId: DataTypes.UUID,
//       type: DataTypes.STRING,
//       metaData: DataTypes.JSON,
//     },
//     {
//       sequelize,
//       modelName: 'Dataflow',
//       tableName: 'dataflows',
//       paranoid: true,
//     }
//   );
//
//   return Dataflow;
// };
