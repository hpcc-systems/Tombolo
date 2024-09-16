// role types model definition
'use strict';
module.exports = (sequelize, DataTypes) => {
  const RoleTypes = sequelize.define("RoleTypes",{
    id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        }, 
    roleName:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    description:{
        type: DataTypes.STRING,
        allowNull: false,
    },
},
{ 
    tableName: 'role_types',
    freezeTableName: true,
    timeStamps: true,
    paranoid: true
}

  );
  RoleTypes.associate = function(models) {
    // associations can be defined here
    RoleTypes.belongsToMany(models.User, {
      through: models.UserRoles,
      foreignKey: "roleId",
      onDelete: "CASCADE",
    });
  };
  return RoleTypes;
};