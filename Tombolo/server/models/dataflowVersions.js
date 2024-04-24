'use strict';
module.exports = (sequelize, DataTypes) => {
  const dataflow = sequelize.define('dataflow_versions', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    isLive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    graph: DataTypes.JSON,
    createdBy: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    dataflowId: DataTypes.UUID,
  }, {paranoid: true, freezeTableName: true});
  dataflow.associate = function(models) {
    dataflow.belongsTo(models.dataflow, {foreignKey: 'dataflowId'});
    dataflow.hasMany(models.job_execution, { foreignKey: 'dataflowVersionId', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });    
  };
  return dataflow;
};