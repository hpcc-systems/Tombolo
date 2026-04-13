import type { Cluster } from '@tombolo/db';

export type ResolvedCluster = Cluster['dataValues'];
export type ClusterWithError = ResolvedCluster & { error: string };
export type GetClustersResult = ResolvedCluster | ClusterWithError;
export type ClusterReachabilityResult =
  | {
      reached: true;
      statusCode: 200 | 403;
      message?: string;
      error?: unknown;
    }
  | {
      reached: false;
      statusCode: number;
      message?: string;
      error?: unknown;
    };
