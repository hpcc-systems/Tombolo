// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class TeamsHook extends Model {
//     // eslint-disable-next-line no-unused-vars
//     static associate(models) {
//       // associations can be defined here
//     }
//   }
//
//   TeamsHook.init(
//     {
//       id: {
//         allowNull: false,
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//       },
//       name: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true,
//       },
//       url: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       createdBy: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       lastModifiedBy: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       approved: {
//         type: DataTypes.BOOLEAN,
//         allowNull: false,
//         defaultValue: true,
//       },
//       approvedBy: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         defaultValue: 'System',
//       },
//       metaData: {
//         type: DataTypes.JSON,
//         allowNull: true,
//       },
//       createdAt: {
//         allowNull: false,
//         type: DataTypes.DATE,
//       },
//       updatedAt: {
//         allowNull: false,
//         type: DataTypes.DATE,
//       },
//       deletedAt: {
//         allowNull: true,
//         type: DataTypes.DATE,
//       },
//     },
//     {
//       sequelize,
//       modelName: 'TeamsHook',
//       tableName: 'teams_hooks',
//       paranoid: true,
//       freezeTableName: true,
//     }
//   );
//
//   return TeamsHook;
// };
