/**
 * HPCC-related services and utilities
 */

import { IOptions } from '@hpcc-js/comms';
import type { ClusterInstance } from '@tombolo/db';

export interface ClusterOptions {
  baseUrl: string;
  userID?: string;
  password?: string;
  type?: string;
  rejectUnauthorized?: boolean;
}

/**
 * Get all clusters or a specific cluster by ID
 * @param clusterId - Optional cluster ID to filter
 * @returns Array of cluster model instances
 */
export async function getClusters(
  clusterId?: string | null
): Promise<ClusterInstance[]>;

/**
 * Get HPCC connection options from cluster configuration
 * @param cluster - Cluster configuration object
 * @returns Connection options for @hpcc-js/comms
 */
export function getClusterOptions(
  options: IOptions,
  allowSelfSigned?: boolean
): IOptions;

type clusterReachableResponse = {
  reached: boolean;
  statusCode: number;
  message: string;
  error: Error | unknown | null;
};

/**
 * @param clusterHost
 * @param port
 * @param username
 * @param password
 * @returns Object
 */
export async function isClusterReachable(
  clusterHost: string,
  port: string | number,
  username: string | null,
  password: string | null
): Promise<clusterReachableResponse>;
