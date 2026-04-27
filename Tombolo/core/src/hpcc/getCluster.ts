import { Cluster } from '@tombolo/db';
import { decryptString } from '@tombolo/shared';
import { getEncryptionKey } from '../config/config.js';
import { isClusterReachable } from './isClusterReachable.js';
import type { ResolvedCluster } from '../types/cluster.js';

type ClusterRecordWithGet = {
  get?: (options: { plain: true }) => ResolvedCluster;
};

/**
 * Retrieves a single cluster and verifies reachability/credentials.
 * @param clusterId - Cluster ID to fetch
 * @returns Plain cluster object with decrypted hash when reachable and authorized
 */
export async function getCluster(clusterId: string): Promise<ResolvedCluster> {
  const cluster = await Cluster.findOne({ where: { id: clusterId } });
  if (!cluster) {
    throw new Error(`Cluster with id ${clusterId} not in database`);
  }

  const clusterRecord = cluster as unknown as ClusterRecordWithGet;
  const clusterData =
    typeof clusterRecord.get === 'function'
      ? clusterRecord.get({ plain: true })
      : (cluster as unknown as ResolvedCluster);

  if (clusterData.hash) {
    clusterData.hash = decryptString(clusterData.hash, getEncryptionKey());
  }

  const { reached, statusCode } = await isClusterReachable(
    clusterData.thor_host,
    clusterData.thor_port,
    clusterData.username || '',
    clusterData.hash || ''
  );

  if (reached && statusCode === 200) {
    return clusterData;
  }

  if (reached && statusCode === 403) {
    throw new Error('Invalid cluster credentials');
  }

  throw new Error(`${clusterData.name} is not reachable...`);
}
