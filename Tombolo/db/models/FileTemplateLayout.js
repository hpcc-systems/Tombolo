// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class FileTemplateLayout extends Model {
//     static associate(models) {
//       FileTemplateLayout.belongsTo(models.Application, {
//         foreignKey: 'application_id',
//       });
//       FileTemplateLayout.belongsTo(models.FileTemplate, {
//         foreignKey: 'fileTemplate_id',
//       });
//     }
//   }
//
//   FileTemplateLayout.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       application_id: {
//         type: DataTypes.UUID,
//         allowNull: false,
//       },
//       fileTemplate_id: {
//         type: DataTypes.UUID,
//         allowNull: false,
//       },
//       fields: {
//         type: DataTypes.JSON,
//         allowNull: true,
//       },
//     },
//     {
//       sequelize,
//       modelName: 'FileTemplateLayout',
//       tableName: 'file_template_layouts',
//       paranoid: true,
//     }
//   );
//
//   return FileTemplateLayout;
// };
