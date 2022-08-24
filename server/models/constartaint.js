'use strict';

module.exports = (sequelize, DataTypes) => {
  const constraint = sequelize.define('constraint', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    name: DataTypes.STRING,
    nature: DataTypes.STRING,
    source: DataTypes.STRING,
    scope: DataTypes.STRING,
    description: DataTypes.TEXT,
    permissible_purposes: DataTypes.TEXT,
    application_id: {
      type: DataTypes.UUID,
      allowNull: true,
    }
  }, {paranoid: true, freezeTableName: true});

  constraint.associate = function(models) {

    constraint.belongsTo(models.application, {
      foreignKey: 'application_id'
    });

    // job.belongsToMany(models.groups, {
    //   constraints:false,
    //   foreignKeyConstraint:false,
    //   through: 'assets_groups',
    //   as: 'groups',
    //   foreignKey: 'assetId',
    //   otherKey: 'groupId'
    // });
  };
  return constraint;
};