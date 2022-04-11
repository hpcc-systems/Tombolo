'use strict';
module.exports = (sequelize, DataTypes) => {
  const GHCredentials = sequelize.define('github_repo_settings', {
    id: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ghProject: {
      allowNull: false,
      type: DataTypes.STRING
    },
    ghLink: {
      allowNull: false,
      type: DataTypes.STRING
    },
    ghBranchOrTag: {
      allowNull: false,
      type: DataTypes.STRING
    },
    ghToken: {
      type: DataTypes.STRING
    },
    ghUserName: {
      type: DataTypes.STRING
    },
  }, 
  { paranoid: true } );
  
  GHCredentials.associate = function(models) {
    // associations can be defined here
    GHCredentials.belongsTo(models.application, { foreignKey: 'application_id' });
  };

  return GHCredentials;
};
