// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class Constraint extends Model {
//     static associate(models) {
//       Constraint.belongsTo(models.Application, {
//         foreignKey: 'application_id',
//       });
//
//       // Constraint.belongsToMany(models.Group, {
//       //   constraints: false,
//       //   foreignKeyConstraint: false,
//       //   through: 'assets_groups',
//       //   as: 'groups',
//       //   foreignKey: 'assetId',
//       //   otherKey: 'groupId',
//       // });
//     }
//   }
//
//   Constraint.init(
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
//         allowNull: true, // TODO: Should this be allowed null?
//       },
//       short_description: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       description: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       application_id: {
//         type: DataTypes.UUID,
//         allowNull: true,
//       },
//     },
//     {
//       sequelize,
//       modelName: 'Constraint',
//       tableName: 'constraints',
//       paranoid: true,
//     }
//   );
//
//   return Constraint;
// };
