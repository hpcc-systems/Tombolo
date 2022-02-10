'use strict';
module.exports = (sequelize, DataTypes) => {
  const GHCredentials = sequelize.define('GHCredentials', {
    id: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: DataTypes.STRING,
    GHUsername: DataTypes.STRING,
    GHToken: DataTypes.STRING
  }, {paranoid: true});
  
  GHCredentials.associate = function(models) {
    // associations can be defined here
  };
  return GHCredentials;
};
