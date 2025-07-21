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
     type:  DataTypes.UUID,
     allowNull: false,
    },
    fileTemplate_id :{
     type:  DataTypes.UUID,
     allowNull: false,
    },
    fields:{
      type: DataTypes.JSON,
      allowNull : true
    }
  }, {paranoid: true, freezeTableName: true});
  fileTemplateLayout.associate = function(models) {
    // Define association here

    fileTemplateLayout.belongsTo(models.application, { foreignKey: 'application_id' });
    fileTemplateLayout.belongsTo(models.fileTemplate, { foreignKey: 'fileTemplate_id' });

  };
  return fileTemplateLayout;
};
