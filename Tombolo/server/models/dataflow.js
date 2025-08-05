'use strict';
module.exports = (sequelize, DataTypes) => {
  const dataflow = sequelize.define(
    'dataflow',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      graph: DataTypes.JSON,
      application_id: DataTypes.UUID,
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
      input: DataTypes.STRING,
      output: DataTypes.STRING,
      clusterId: DataTypes.UUID,
      type: DataTypes.STRING,
      metaData: DataTypes.JSON,
    },
    { paranoid: true, freezeTableName: true }
  );
  dataflow.associate = function (models) {
    dataflow.hasOne(models.dataflow_cluster_credentials, {
      foreignKey: 'dataflow_id',
    });
    dataflow.hasMany(models.job_execution, {
      foreignKey: 'dataflowId',
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    });
    dataflow.hasMany(models.dataflow_versions, {
      foreignKey: 'dataflowId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    dataflow.belongsTo(models.Application, { foreignKey: 'application_id' });
    dataflow.belongsTo(models.Cluster, { foreignKey: 'clusterId' });
  };
  return dataflow;
};
