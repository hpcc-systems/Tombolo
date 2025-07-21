// role types model definition
'use strict';
module.exports = (sequelize, DataTypes) => {

  // Define the RoleTypes
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
    paranoid: true,
    hooks: {
      beforeBulkDestroy: async(roleType, options) => {
        // Deleted associated user roles
        const UserRoles = sequelize.models.UserRoles;
        await UserRoles.destroy({where: {roleId: roleType.where.id,}});
      },
    }
}

  );

  // Associations
  RoleTypes.associate = function(models) {
    RoleTypes.hasMany(models.UserRoles, {
      foreignKey: 'roleId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };
  
  return RoleTypes;
};