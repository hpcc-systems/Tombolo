// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class IndexPayload extends Model {
//     // eslint-disable-next-line no-unused-vars
//     static associate(models) {
//       // associations can be defined here
//     }
//   }
//
//   IndexPayload.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       index_id: DataTypes.UUID,
//       application_id: DataTypes.UUID,
//       name: DataTypes.STRING,
//       type: DataTypes.STRING,
//       eclType: DataTypes.STRING,
//     },
//     {
//       sequelize,
//       modelName: 'IndexPayload',
//       tableName: 'index_payloads',
//       paranoid: true,
//     }
//   );
//
//   return IndexPayload;
// };
