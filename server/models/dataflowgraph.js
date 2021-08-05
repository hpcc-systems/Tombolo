'use strict';
module.exports = (sequelize, DataTypes) => {
  const dataflowgraph = sequelize.define('dataflowgraph', {
  	id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    nodes: DataTypes.TEXT,
    edges: DataTypes.TEXT,
    dataflowId: DataTypes.UUID
  }, {paranoid: true, freezeTableName: true});
  dataflowgraph.associate = function(models) {
    dataflowgraph.belongsTo(models.dataflow)
  };
  return dataflowgraph;
};