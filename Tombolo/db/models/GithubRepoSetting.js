// 'use strict';
//
// const { Model } = require('sequelize');
//
// module.exports = (sequelize, DataTypes) => {
//   class GithubRepoSetting extends Model {
//     static associate(models) {
//       GithubRepoSetting.belongsTo(models.Application, {
//         foreignKey: 'application_id',
//       });
//     }
//   }
//
//   GithubRepoSetting.init(
//     {
//       id: {
//         primaryKey: true,
//         allowNull: false,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//       },
//       application_id: {
//         type: DataTypes.UUID,
//         allowNull: false,
//       },
//       ghProject: {
//         allowNull: false,
//         type: DataTypes.STRING,
//       },
//       ghLink: {
//         allowNull: false,
//         type: DataTypes.STRING,
//       },
//       ghBranchOrTag: {
//         allowNull: false,
//         type: DataTypes.STRING,
//       },
//       ghToken: {
//         type: DataTypes.STRING,
//       },
//       ghUserName: {
//         type: DataTypes.STRING,
//       },
//     },
//     {
//       sequelize,
//       modelName: 'GithubRepoSetting',
//       tableName: 'github_repo_settings',
//       paranoid: true,
//     }
//   );
//
//   return GithubRepoSetting;
// };
