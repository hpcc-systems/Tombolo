'use strict';
module.exports = (sequelize, DataTypes) => {
  const jobfile = sequelize.define('jobfile', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    job_id: DataTypes.UUID,
    application_id: DataTypes.UUID,
    file_type: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    file_id: DataTypes.UUID,
    added_manually:{
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isSuperFile:{
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {paranoid: true, freezeTableName: true});
  jobfile.associate = function(models) {
    // associations can be defined here
  };
  return jobfile;
};