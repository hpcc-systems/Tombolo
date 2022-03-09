'use strict';
module.exports = (sequelize, DataTypes) => {
  const fileTemplateLayout = sequelize.define('fileTemplateLayout', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    application_id: {
     type:  DataTypes.UUIDV4,
     allowNull: false,
    },
    fileTemplate_id :{
     type:  DataTypes.UUIDV4,
     allowNull: false,
    },
    fields:{
      type: DataTypes.JSON,
      allowNull : true
    }
  }, {paranoid: true, freezeTableName: true});
  fileTemplateLayout.associate = function(models) {
    // Define association here
  };
  return fileTemplateLayout;
};
