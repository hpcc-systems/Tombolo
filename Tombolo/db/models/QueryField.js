// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class QueryField extends Model {
//     static associate(models) {
//       QueryField.belongsTo(models.Query, { foreignKey: 'query_id' });
//       QueryField.belongsTo(models.Application, {
//         foreignKey: 'application_id',
//       });
//     }
//   }
//
//   QueryField.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       query_id: DataTypes.UUID,
//       application_id: DataTypes.UUID,
//       field_type: DataTypes.STRING,
//       name: DataTypes.STRING,
//       type: DataTypes.STRING,
//     },
//     {
//       sequelize,
//       modelName: 'QueryField',
//       tableName: 'query_fields',
//       paranoid: true,
//       freezeTableName: true,
//     }
//   );
//
//   return QueryField;
// };
