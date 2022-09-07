'use strict';
module.exports = (sequelize, DataTypes) => {
  const report = sequelize.define('report', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    type: DataTypes.STRING,
    isBaseLine: DataTypes.BOOLEAN,
    report: DataTypes.JSON,
    application_id: DataTypes.UUID,
  }, {paranoid: true, freezeTableName: true});

  report.associate = function(models) {
    report.belongsTo(models.application, { foreignKey: 'application_id' });    
  };

  return report;
};
