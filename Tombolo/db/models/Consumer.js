// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class Consumer extends Model {
//     // eslint-disable-next-line no-unused-vars
//     static associate(models) {
//       // No associations defined currently
//     }
//   }
//
//   Consumer.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       name: {
//         type: DataTypes.STRING,
//         allowNull: true, // Implicit, as allowNull is not specified
//       },
//       type: {
//         type: DataTypes.STRING,
//         allowNull: true, // Implicit
//       },
//       contact_name: {
//         type: DataTypes.STRING,
//         allowNull: true, // Implicit
//       },
//       contact_email: {
//         type: DataTypes.STRING,
//         allowNull: true, // Implicit
//       },
//       ad_group: {
//         type: DataTypes.STRING,
//         allowNull: true, // Implicit
//       },
//       assetType: {
//         type: DataTypes.STRING,
//         allowNull: true, // Implicit
//       },
//       transferType: {
//         type: DataTypes.STRING,
//         allowNull: true, // Implicit
//       },
//     },
//     {
//       sequelize,
//       modelName: 'Consumer',
//       tableName: 'consumers',
//       paranoid: true,
//     }
//   );
//
//   return Consumer;
// };
