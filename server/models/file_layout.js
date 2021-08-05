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
    /*{
      type: DataTypes.TEXT,
      get: function() {
          return JSON.parse(this.getDataValue('children'));
      },
      set: function(val) {
          return this.setDataValue('children', JSON.stringify(val));
      }
    },*/
    fields: DataTypes.TEXT
  }, {paranoid: true, freezeTableName: true});
  file_layout.associate = function(models) {
    file_layout.belongsTo(models.file, {
      foreignKey: 'file_id'
    });
  };
  return file_layout;
};