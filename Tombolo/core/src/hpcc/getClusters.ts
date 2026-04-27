import { Cluster } from '@tombolo/db';
import { decryptString } from '@tombolo/shared';
import { isClusterReachable } from './isClusterReachable.js';
import { getEncryptionKey } from '../config/config.js';
import type {
  ClusterWithError,
  GetClustersResult,
  ResolvedCluster,
} from '../types/cluster.js';

type ClusterRecordWithGet = {
  get?: (options: { plain: true }) => ResolvedCluster;
};

const toPlainClusterData = (cluster: Cluster): ResolvedCluster => {
  const clusterRecord = cluster as unknown as ClusterRecordWithGet;
  return typeof clusterRecord.get === 'function'
    ? clusterRecord.get({ plain: true })
    : (cluster as unknown as ResolvedCluster);
};

/**
 * Retrieves cluster details and ensures the cluster is reachable
 * @param clusterIds - The cluster IDs you would like to be fetched (null for all clusters)
 * @returns Array of cluster objects with reachability status
 */
export async function getClusters(
  clusterIds: string[] | null
): Promise<GetClustersResult[]> {
  const whereClause = clusterIds === null ? {} : { where: { id: clusterIds } };
  const clusters: Cluster[] = await Cluster.findAll(whereClause);

  const clusterPromises = clusters.map(async cluster => {
    try {
      const clusterData = toPlainClusterData(cluster);

      if (clusterData.hash) {
        clusterData.hash = decryptString(clusterData.hash, getEncryptionKey());
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
        } as ClusterWithError;
      } else {
        return {
          error: `${clusterData.name} is not reachable...`,
          ...clusterData,
        } as ClusterWithError;
      }
    } catch (err: unknown) {
      const clusterData = toPlainClusterData(cluster);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        error: `Error with cluster ${clusterData.name}: ${errorMessage}`,
        ...clusterData,
      } as ClusterWithError;
    }
  });

  return await Promise.all(clusterPromises);
}
