'use strict';
module.exports = (sequelize, DataTypes) => {
  const query_field = sequelize.define(
    'query_field',
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      query_id: DataTypes.UUID,
      application_id: DataTypes.UUID,
      field_type: DataTypes.STRING,
      name: DataTypes.STRING,
      type: DataTypes.STRING,
    },
    { paranoid: true, freezeTableName: true }
  );
  query_field.associate = function (models) {
    // associations can be defined here
    query_field.belongsTo(models.Query, { foreignKey: 'query_id' });
    query_field.belongsTo(models.Application, { foreignKey: 'application_id' });
  };
  return query_field;
};
