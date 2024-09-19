// user and role types mapping table
'use strict';
module.exports = (sequelize, DataTypes) => {
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
    },
    roleId:{
        type: DataTypes.UUID,
        allowNull: false,
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
  UserRoles.associate = function(models) {
  };
  return UserRoles;
};

