'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MessageBasedJobs extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // associations can be defined here
    }
  }

  MessageBasedJobs.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      applicationId: DataTypes.UUID,
      jobId: DataTypes.UUID,
      dataflowId: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: 'MessageBasedJob',
      tableName: 'message_based_jobs',
      paranoid: true,
      freezeTableName: true,
    }
  );

  return MessageBasedJobs;
};
