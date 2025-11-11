// 'use strict';
//
// const { Model, DataTypes } = require('sequelize');
//
// module.exports = sequelize => {
//   class JobFile extends Model {
//     // eslint-disable-next-line no-unused-vars
//     static associate(models) {
//       // associations can be defined here
//     }
//   }
//
//   JobFile.init(
//     {
//       id: {
//         primaryKey: true,
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         autoIncrement: false,
//       },
//       job_id: DataTypes.UUID,
//       application_id: DataTypes.UUID,
//       file_type: DataTypes.STRING,
//       name: DataTypes.STRING,
//       description: DataTypes.TEXT,
//       file_id: DataTypes.UUID,
//       added_manually: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//       },
//       isSuperFile: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//       },
//     },
//     {
//       sequelize,
//       modelName: 'JobFile',
//       tableName: 'job_files',
//       paranoid: true,
//     }
//   );
//
//   return JobFile;
// };
