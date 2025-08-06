'use strict';
module.exports = (sequelize, DataTypes) => {
  const data_types = sequelize.define(
    'data_types',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      name: DataTypes.STRING,
    },
    { paranoid: true, freezeTableName: true }
  );
  // eslint-disable-next-line no-unused-vars
  data_types.associate = function (models) {
    // associations can be defined here
  };
  return data_types;
};
