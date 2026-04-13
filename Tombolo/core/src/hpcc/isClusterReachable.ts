import axios from 'axios';
import type { ClusterReachabilityResult } from '../types/cluster.js';

/**
 * Check if an HPCC cluster is reachable
 * @param clusterHost - The host URL of the cluster
 * @param port - The port number
 * @param username - Optional username for authentication
 * @param password - Optional password for authentication
 * @returns Promise with reachability status
 */
export async function isClusterReachable(
  clusterHost: string,
  port: number | string,
  username?: string,
  password?: string
): Promise<ClusterReachabilityResult> {
  const auth = {
    username: username || '',
    password: password || '',
  };

  try {
    const response = await axios.get(`${clusterHost}:${port}`, {
      auth: auth,
      timeout: 5000,
    });

    if (response.status === 200) {
      return {
        reached: true,
        statusCode: 200,
        message: 'success',
        error: null,
      };
    } else {
      return {
        reached: false,
        statusCode: response.status,
        message: 'Unknown response status',
        error: null,
      };
    }
  } catch (error: unknown) {
    let message: string;
    if (axios.isAxiosError(error) && error.response) {
      // Server responded with an error status
      if (error.response.status === 401) {
        message = `${clusterHost} - Access denied`;
        return { reached: true, statusCode: 403, message, error };
      } else {
        message = 'Unknown Error';
      }
    } else if (axios.isAxiosError(error)) {
      // Network error or timeout
      message = `Checking cluster reachability - ${error.message}`;
    } else {
      message = 'Checking cluster reachability - Unknown error';
    }

    return { reached: false, statusCode: 503, message, error };
  }
}
