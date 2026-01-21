// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class File extends Model {
//     static associate(models) {
//       File.hasMany(models.FileValidation, {
//         foreignKey: 'file_id',
//         onDelete: 'CASCADE',
//       });
//       File.hasMany(models.Indexes, {
//         foreignKey: 'parentFileId',
//         onDelete: 'CASCADE',
//       });
//       File.hasMany(models.ConsumerObject, {
//         foreignKey: 'consumer_id',
//         onDelete: 'CASCADE',
//       });
//       File.belongsTo(models.Application, { foreignKey: 'application_id' });
//       File.belongsToMany(models.Group, {
//         constraints: false,
//         foreignKeyConstraint: false,
//         through: 'assets_groups',
//         as: 'groups',
//         foreignKey: 'assetId',
//         otherKey: 'groupId',
//       });
//       File.belongsToMany(models.Job, {
//         constraints: false,
//         foreignKeyConstraint: false,
//         through: 'job_files',
//         foreignKey: 'file_id',
//         otherKey: 'job_id',
//       });
//     }
//   }
//
//   File.init(
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
//       name: DataTypes.STRING(500),
//       cluster_id: DataTypes.UUID,
//       description: DataTypes.TEXT,
//       fileType: DataTypes.STRING,
//       isSuperFile: DataTypes.BOOLEAN,
//       serviceURL: DataTypes.STRING,
//       qualifiedPath: DataTypes.STRING,
//       consumer: DataTypes.STRING,
//       supplier: DataTypes.STRING,
//       owner: DataTypes.STRING,
//       scope: DataTypes.STRING(500),
//       metaData: {
//         type: DataTypes.JSON,
//         allowNull: true,
//         defaultValue: null,
//       },
//     },
//     {
//       sequelize,
//       modelName: 'File',
//       tableName: 'file',
//       paranoid: true,
//     }
//   );
//
//   return File;
// };
