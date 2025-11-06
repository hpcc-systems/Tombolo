// 'use strict';
//
// const { Model, DataTypes } = require('sequelize');
//
// module.exports = sequelize => {
//   class AssetsGroup extends Model {
//     // eslint-disable-next-line no-unused-vars
//     static associate(models) {
//       // Define associations here if needed
//     }
//   }
//
//   AssetsGroup.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       assetId: {
//         type: DataTypes.UUID,
//         allowNull: true,
//       },
//       groupId: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//       },
//     },
//     {
//       sequelize,
//       modelName: 'AssetsGroup',
//       tableName: 'assets_groups',
//       paranoid: true,
//     }
//   );
//
//   return AssetsGroup;
// };
