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
    application_id: DataTypes.STRING,
    file_id: DataTypes.STRING,
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    eclType: DataTypes.STRING,
    displayType: DataTypes.STRING,
    displaySize: DataTypes.STRING,
    textJustification: DataTypes.STRING,
    format: DataTypes.STRING,
    data_types: DataTypes.STRING,
    isPCI: DataTypes.STRING,
    isPII: DataTypes.STRING,
    isHIPAA: DataTypes.STRING,
    description: DataTypes.TEXT,
    required: DataTypes.BOOLEAN
  }, {freezeTableName: true});
  file_layout.associate = function(models) {
    file_layout.belongsTo(models.file, {
      foreignKey: 'file_id'
    });
  };
  return file_layout;
};