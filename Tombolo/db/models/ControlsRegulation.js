// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class ControlsRegulation extends Model {
//     // eslint-disable-next-line no-unused-vars
//     static associate(models) {
//       // associations can be defined here
//     }
//   }
//
//   ControlsRegulation.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       compliance: DataTypes.STRING,
//       data_types: DataTypes.STRING,
//     },
//     {
//       sequelize,
//       modelName: 'ControlsRegulation',
//       tableName: 'controls_regulations',
//       paranoid: true,
//     }
//   );
//
//   return ControlsRegulation;
// };
