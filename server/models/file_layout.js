'use strict';
module.exports = (sequelize, DataTypes) => {
  const file_layout = sequelize.define('file_layout', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: DataTypes.UUID,
    file_id: DataTypes.UUID,
    fields: DataTypes.TEXT
  }, {paranoid: true, freezeTableName: true});
  file_layout.associate = function(models) {
    file_layout.belongsTo(models.file, { foreignKey: 'file_id' });
    file_layout.belongsTo(models.application, { foreignKey: 'application_id' });
  };
  return file_layout;
};