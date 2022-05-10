'use strict';
module.exports = (sequelize, DataTypes) => {
  const datadictionary = sequelize.define('datadictionary', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    applicationId: DataTypes.UUID,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    data_defn: {
      type: DataTypes.TEXT,
      get() {
        return JSON.parse(this.getDataValue('data_defn'));
      }
    },
    products: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  datadictionary.associate = function(models) {
    // associations can be defined here
  };
  return datadictionary;
};