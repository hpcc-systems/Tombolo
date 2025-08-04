'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConsumerObject extends Model {
    static associate(models) {
      ConsumerObject.belongsTo(models.file, { foreignKey: 'consumer_id' });
    }
  }

  ConsumerObject.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      consumer_id: {
        type: DataTypes.UUID,
        allowNull: true, // Implicit
      },
      object_id: {
        type: DataTypes.STRING,
        allowNull: true, // Implicit
      },
      object_type: {
        type: DataTypes.STRING,
        allowNull: true, // Implicit
      },
    },
    {
      sequelize,
      modelName: 'ConsumerObject',
      tableName: 'consumer_objects',
      paranoid: true,
    }
  );

  return ConsumerObject;
};
