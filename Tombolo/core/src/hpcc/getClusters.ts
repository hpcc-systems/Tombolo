import { Cluster } from '@tombolo/db';
import { decryptString } from '@tombolo/shared';
import { isClusterReachable } from './isClusterReachable.js';
import { ENCRYPTION_KEY } from '../config/config.js';

interface ClusterWithError {
  error?: string;
  [key: string]: any;
}

/**
 * Retrieves cluster details and ensures the cluster is reachable
 * @param clusterIds - The cluster IDs you would like to be fetched (null for all clusters)
 * @returns Array of cluster objects with reachability status
 */
export async function getClusters(
  clusterIds: string[] | null
): Promise<ClusterWithError[]> {
  const whereClause = clusterIds === null ? {} : { where: { id: clusterIds } };
  const clusters = await Cluster.findAll(whereClause);

  const clusterPromises = clusters.map(async cluster => {
    try {
      const clusterData = cluster.get({ plain: true }) as any;

      if (clusterData.hash) {
        clusterData.hash = decryptString(clusterData.hash, ENCRYPTION_KEY);
      }

      const isReachable = await isClusterReachable(
        clusterData.thor_host,
        clusterData.thor_port,
        clusterData.username,
        clusterData.hash
      );

      const { reached, statusCode } = isReachable;
      if (reached && statusCode === 200) {
        return clusterData;
      } else if (reached && statusCode === 403) {
        return {
          error: 'Invalid cluster credentials',
          ...clusterData,
        };
      } else {
        return {
          error: `${clusterData.name} is not reachable...`,
          ...clusterData,
        };
      }
    } catch (err: any) {
      const clusterData = cluster.get({ plain: true }) as any;
      return {
        error: `Error with cluster ${clusterData.name}: ${err.message}`,
        ...clusterData,
      };
    }
  });

  return await Promise.all(clusterPromises);
}
