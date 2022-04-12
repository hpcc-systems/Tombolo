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
    application_id: DataTypes.STRING,
    file_type: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    file_id: DataTypes.STRING,
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
    jobfile.belongsTo(models.job, {foreignKey: 'job_id'});
    // associations can be defined here
  };
  return jobfile;
};