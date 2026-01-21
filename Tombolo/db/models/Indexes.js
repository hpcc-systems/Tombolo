// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class Indexes extends Model {
//     static associate(models) {
//       Indexes.hasMany(models.IndexKey, {
//         foreignKey: 'index_id',
//         onDelete: 'CASCADE',
//         hooks: true,
//       });
//       Indexes.hasMany(models.IndexPayload, {
//         foreignKey: 'index_id',
//         onDelete: 'CASCADE',
//         hooks: true,
//       });
//       Indexes.belongsTo(models.Application, {
//         foreignKey: 'application_id',
//       });
//       // Indexes.belongsTo(models.File, {
//       //   foreignKey: 'parentFileId',
//       // });
//       // Indexes.belongsToMany(models.Group, {
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
//   Indexes.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       application_id: DataTypes.UUID,
//       title: DataTypes.STRING,
//       name: DataTypes.STRING,
//       description: DataTypes.TEXT,
//       primaryService: DataTypes.STRING,
//       backupService: DataTypes.STRING,
//       qualifiedPath: DataTypes.STRING,
//       parentFileId: {
//         type: DataTypes.UUID,
//         defaultValue: null,
//       },
//       registrationTime: DataTypes.STRING,
//       metaData: DataTypes.JSON,
//       updatedDateTime: DataTypes.STRING,
//       dataLastUpdatedTime: DataTypes.STRING,
//       createdAt: DataTypes.DATE,
//       updatedAt: DataTypes.DATE,
//       deletedAt: DataTypes.DATE,
//     },
//     {
//       sequelize,
//       modelName: 'Indexes',
//       tableName: 'indexes',
//       paranoid: true,
//     }
//   );
//
//   return Indexes;
// };
