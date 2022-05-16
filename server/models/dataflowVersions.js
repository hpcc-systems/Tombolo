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
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    graph: DataTypes.JSON,
    dataflowId: DataTypes.UUID,
  }, {paranoid: true, freezeTableName: true});
  dataflow.associate = function(models) {
    dataflow.belongsTo(models.dataflow, {foreignKey: 'dataflowId'});
  };
  return dataflow;
};