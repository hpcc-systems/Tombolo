'use strict';
module.exports = (sequelize, DataTypes) => {
  const controls_regulations = sequelize.define('controls_regulations', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    compliance: DataTypes.STRING,
    identity_details:DataTypes.STRING,
  }, {freezeTableName: true});
  identity_details.associate = function(models) {
    // associations can be defined here
  };
  return controls_regulations;
};