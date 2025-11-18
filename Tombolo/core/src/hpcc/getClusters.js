const db = require('@tombolo/db');
const { decryptString } = require('@tombolo/shared');
const isClusterReachable = require('./isClusterReachable');
const { ENCRYPTION_KEY } = require('../config/config');

const { Cluster } = db;

/**
 * Retrieves cluster details and ensures the cluster is reachable
 * @param {string[] | null} clusterIds - The clusterIds you would like to be fetched
 * @returns {@import("@tombolo/db").Cluster} Encrypted string
 */
async function getClusters(clusterIds) {
  const whereClause = clusterIds === null ? {} : { where: { id: clusterIds } };
  const clusters = await Cluster.findAll(whereClause);
  const clusterPromises = clusters.map(async cluster => {
    try {
      if (cluster.hash) {
        cluster.hash = decryptString(cluster.hash, ENCRYPTION_KEY);
      }

      const isReachable = await isClusterReachable(
        cluster.thor_host,
        cluster.thor_port,
        cluster.username,
        cluster.hash
      );
      const { reached, statusCode } = isReachable;
      if (reached && statusCode === 200) {
        return cluster;
      } else if (reached && statusCode === 403) {
        return {
          error: 'Invalid cluster credentials',
          ...cluster,
        };
      } else {
        return {
          error: `${cluster.name} is not reachable...`,
          ...cluster,
        };
      }
    } catch (err) {
      return {
        error: `Error with cluster ${cluster.name}: ${err.message}`,
        ...cluster,
      };
    }
  });

  return await Promise.all(clusterPromises);
}

module.exports = { getClusters };
