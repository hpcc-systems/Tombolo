'use strict';
module.exports = (sequelize, DataTypes) => {
  const WorkflowGraph = sequelize.define('workflowgraph', {
  	id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    nodes: DataTypes.TEXT,
    edges: DataTypes.TEXT
  }, {freezeTableName: true});
  WorkflowGraph.associate = function(models) {
    // associations can be defined here
  };
  return WorkflowGraph;
};