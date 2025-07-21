'use strict';
module.exports = (sequelize, DataTypes) => {
  const rules = sequelize.define('rules', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    name: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  rules.associate = function(models) {
    // associations can be defined here
  };
  return rules;
};