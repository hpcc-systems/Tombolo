'use strict';
module.exports = (sequelize, DataTypes) => {
  const jobparam = sequelize.define('jobparam', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    job_id: DataTypes.STRING,
    application_id: DataTypes.STRING,
    name: DataTypes.STRING,
    type: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  jobparam.associate = function(models) {
    // associations can be defined here
  };
  return jobparam;
};