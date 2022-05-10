'use strict';
module.exports = (sequelize, DataTypes) => {
  const file_instance = sequelize.define('file_instance', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: false
    },
    file_definition: DataTypes.STRING,
    receive_date: DataTypes.DATE,
    media_type: DataTypes.STRING,
    update_type: DataTypes.STRING,
    expected_file_count: DataTypes.INTEGER,
    actual_file_count: DataTypes.INTEGER,
    customer_name: DataTypes.STRING,
    frequency: DataTypes.STRING,
    next_expected_delivery: DataTypes.STRING,
    item_name: DataTypes.STRING,
    source_name: DataTypes.STRING,
    data_provider_id: DataTypes.STRING,
    member_id: DataTypes.STRING,
    file_source_id: DataTypes.STRING,
    data_profile_path: DataTypes.STRING,
    cluster_id: DataTypes.UUID,
    application_id: DataTypes.UUID,
    title: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  file_instance.associate = function(models) {
    // associations can be defined here
    file_instance.belongsTo(models.application, {foreignKey: 'application_id'});
    file_instance.belongsTo(models.cluster, {foreignKey: 'cluster_id'});
  };
  return file_instance;
};
