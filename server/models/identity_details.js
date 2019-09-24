'use strict';
module.exports = (sequelize, DataTypes) => {
  const identity_details = sequelize.define('identity_details', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    name: DataTypes.STRING
  }, {freezeTableName: true});
  identity_details.associate = function(models) {
    // associations can be defined here
  };
  return identity_details;
};