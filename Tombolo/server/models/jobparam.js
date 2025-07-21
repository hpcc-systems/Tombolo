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
    job_id: DataTypes.UUID,
    application_id: DataTypes.UUID,
    name: DataTypes.STRING,
    type: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  jobparam.associate = function(models) {
    // associations can be defined here
    jobparam.belongsTo(models.job, { foreignKey: 'job_id' });
    jobparam.belongsTo(models.application, { foreignKey: 'application_id' });
  };
  return jobparam;
};