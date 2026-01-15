import axios from 'axios';

interface ClusterReachabilityResult {
  reached: boolean;
  statusCode: number;
  message: string;
  error: any;
}

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
        reached: true,
        statusCode: response.status,
        message: 'Unknown response status',
        error: null,
      };
    }
  } catch (error: any) {
    let message: string;
    if (error.response) {
      // Server responded with an error status
      if (error.response.status === 401) {
        message = `${clusterHost} - Access denied`;
        return { reached: true, statusCode: 403, message, error };
      } else {
        message = 'Unknown Error';
      }
    } else {
      // Network error or timeout
      message = `Checking cluster reachability - ${error.message}`;
    }

    return { reached: false, statusCode: 503, message, error };
  }
}
