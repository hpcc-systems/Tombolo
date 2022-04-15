module.exports = (sequelize, DataTypes) => {
  const dataflow_cluster_credentials = sequelize.define('dataflow_cluster_credentials', {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    dataflow_id: DataTypes.STRING,
    cluster_id: DataTypes.UUID,
    cluster_username: DataTypes.STRING,
    cluster_hash: DataTypes.STRING
  }, {paranoid: true, freezeTableName: true});
  dataflow_cluster_credentials.associate = function(models) {
    dataflow_cluster_credentials.belongsTo(models.dataflow, {foreignKey: 'dataflow_id'});
    dataflow_cluster_credentials.belongsTo(models.cluster, {foreignKey: 'cluster_id'});
  };
  return dataflow_cluster_credentials;
};