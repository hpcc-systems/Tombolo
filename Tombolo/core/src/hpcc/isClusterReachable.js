const axios = require('axios');

/*
response :  undefined -> cluster not reached network issue or cluster not available
response.status : 200 -> Cluster reachable
response.status : 403 -> Cluster reachable but Unauthorized
*/

/**
 * @param {string} clusterHost
 * @param {number | string} port
 * @param {string?} username
 * @param {string?} password
 * @returns {Promise<object>} Returns a customized IOptions
 */
const isClusterReachable = async (clusterHost, port, username, password) => {
  let auth = {
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
  } catch (error) {
    let message;
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
};

module.exports = isClusterReachable;
