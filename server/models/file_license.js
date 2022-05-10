'use strict';
module.exports = (sequelize, DataTypes) => {
  const file_license = sequelize.define('file_license', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.UUID,
    file_id: DataTypes.UUID,
    name: DataTypes.STRING,
    url: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  file_license.associate = function(models) {
    file_license.belongsTo(models.file, { foreignKey: 'file_id' });
    file_license.belongsTo(models.application, { foreignKey: 'application_id' });
  };
  return file_license;
};