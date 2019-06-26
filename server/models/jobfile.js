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
    job_id: DataTypes.STRING,
    application_id: DataTypes.STRING,
    file_type: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    file_id: DataTypes.STRING
  }, {freezeTableName: true});
  jobfile.associate = function(models) {
    // associations can be defined here
  };
  return jobfile;
};