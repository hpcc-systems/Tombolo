'use strict';
module.exports = (sequelize, DataTypes) => {
  const dependent_jobs = sequelize.define('dependent_jobs', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    jobId: DataTypes.UUID,
    dataflowId: DataTypes.UUID,
    dependsOnJobId: DataTypes.UUID,
    dependOnAssetType : {
      type : DataTypes.STRING,
      allowNull: false
    }
  }, {paranoid: true, freezeTableName: true});

  return dependent_jobs;
};