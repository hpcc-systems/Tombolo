'use strict';
module.exports = (sequelize, DataTypes) => {
  const fileTemplate = sequelize.define('fileTemplate', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.STRING,
    title: DataTypes.STRING,
    fileNamePattern : DataTypes.STRING,
    searchString : DataTypes.STRING,
    cluster_id: DataTypes.STRING,
    description: DataTypes.TEXT,
  }, {paranoid: true, freezeTableName: true});
  fileTemplate.associate = function(models) {
    // Define association here
  };
  return fileTemplate;
};
