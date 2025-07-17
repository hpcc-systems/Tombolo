const { parentPort } = require('worker_threads');
const axios = require('axios');

// Local imports
const models = require('../../models');
const { decryptString } = require('../../utils/cipher');

// Models
const cluster = models.cluster;

(async () => {
  const startTime = new Date();

  parentPort &&
    parentPort.postMessage({
      level: 'info',
      text: 'Cluster Containerization Check: Job started',
    });

  try {
    // Get all  clusters
    const clusters = await cluster.findAll({
      raw: true,
    });

    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: `Cluster Containerization Check: Found ${clusters.length} active clusters to check`,
      });

    // Make call to each cluster
    for (let clusterInfo of clusters) {
      try {
        // Decrypt password if hash exists
        let password = null;
        if (clusterInfo.hash) {
          try {
            password = decryptString(clusterInfo.hash);
          } catch (error) {
            parentPort &&
              parentPort.postMessage({
                level: 'error',
                text: `Cluster Containerization Check: Failed to decrypt password for cluster ${clusterInfo.name}: ${error.message}`,
              });
            continue;
          }
        }

        // Build the endpoint URL
        const endpoint = `${clusterInfo.thor_host}:${clusterInfo.thor_port}/WsSMC/GetBuildInfo.json`;

        // Prepare axios config
        const axiosConfig = {
          method: 'GET',
          url: endpoint,
          timeout: 30000, // 30 second timeout
        };

        // Add authentication if credentials exist
        if (clusterInfo.username && password) {
          axiosConfig.auth = {
            username: clusterInfo.username,
            password: password,
          };
        }

        // Make the HTTP call
        const response = await axios(axiosConfig);

        // Log the response data
        parentPort &&
          parentPort.postMessage({
            level: 'verbose',
            text: `Cluster Containerization Check: Response for cluster ${clusterInfo.name}: ${JSON.stringify(response.data)}`,
          });
      } catch (error) {
        parentPort &&
          parentPort.postMessage({
            level: 'error',
            text: `Cluster Containerization Check: Error calling cluster ${clusterInfo.name}: ${error.message}`,
          });
      }
    }
  } catch (error) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `Cluster Containerization Check: Error during job execution: ${error.message}`,
        error: error,
      });
  } finally {
    const endTime = new Date();
    const executionTime = endTime - startTime;

    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: `Cluster Containerization Check: Job completed in ${executionTime} ms`,
      });

    if (parentPort) {
      parentPort.postMessage('done');
    } else {
      process.exit(0);
    }
  }
})();
