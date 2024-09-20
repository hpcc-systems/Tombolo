// user and role types mapping table
'use strict';
module.exports = (sequelize, DataTypes) => {
  // Define the UserRoles
  const UserRoles = sequelize.define("UserRoles",{
    id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        },
    userId:{
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users', // Name of the users table
            key: 'id',
        }
    },
    roleId:{
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'role_types', // Name of the role_types table
            key: 'id',
        }
    },
    createdBy:{
        type: DataTypes.UUID,
        allowNull: false,
    },
},
{
    tableName: 'user_roles',
    freezeTableName: true,
    timeStamps: true,
    paranoid: true
}

  );

  // Associations
  UserRoles.associate = function(models) {
   UserRoles.belongsTo(models.user, {foreignKey: 'userId'});
   UserRoles.belongsTo(models.RoleTypes, {foreignKey: 'roleId', as: "role_details"});
  };
  
  return UserRoles;
};

