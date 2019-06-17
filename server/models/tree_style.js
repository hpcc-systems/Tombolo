'use strict';
module.exports = (sequelize, DataTypes) => {
  const tree_style = sequelize.define('tree_style', {
    id: {
      primaryKey: false,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: {
    	primaryKey: true,
    	type: DataTypes.STRING
    },
    node_id: {
    	primaryKey: true,
    	type: DataTypes.STRING
    },
    style: DataTypes.STRING
  }, {freezeTableName: true});
  tree_style.associate = function(models) {
    // associations can be defined here
  };
  return tree_style;
};