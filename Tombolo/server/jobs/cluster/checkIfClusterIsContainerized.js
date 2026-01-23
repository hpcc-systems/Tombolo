import { logOrPostMessage } from '../jobUtils.js';
import axios from 'axios';

// Local imports
import { Cluster } from '../../models.js';
import { decryptString } from '@tombolo/shared';

(async () => {
  const startTime = new Date();

  logOrPostMessage({
    level: 'info',
    text: 'Cluster Containerization Check: Job started',
  });

  try {
    // Get all  clusters
    const clusters = await Cluster.findAll({
      raw: true,
    });

    logOrPostMessage({
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
            password = decryptString(
              clusterInfo.hash,
              process.env.ENCRYPTION_KEY
            );
          } catch (error) {
            logOrPostMessage({
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
        const { data } = await axios(axiosConfig);

        let isContainerized = false;

        if (
          data &&
          data.GetBuildInfoResponse &&
          data.GetBuildInfoResponse.BuildInfo &&
          data.GetBuildInfoResponse.BuildInfo.NamedValue
        ) {
          const { NamedValue } = data.GetBuildInfoResponse.BuildInfo;
          isContainerized = NamedValue.some(
            nv => nv.Name === 'CONTAINERIZED' && nv.Value === 'ON'
          );
        }

        // update the cluster
        await Cluster.update(
          { containerized: isContainerized },
          {
            where: {
              id: clusterInfo.id,
            },
          }
        );
      } catch (error) {
        logOrPostMessage({
          level: 'error',
          text: `Cluster Containerization Check: Error calling cluster ${clusterInfo.name}: ${error.message}`,
        });
      }
    }
  } catch (error) {
    logOrPostMessage({
      level: 'error',
      text: `Cluster Containerization Check: Error during job execution: ${error.message}`,
      error: error,
    });
  } finally {
    const endTime = new Date();
    const executionTime = endTime - startTime;

    logOrPostMessage({
      level: 'info',
      text: `Cluster Containerization Check: Job completed in ${executionTime} ms`,
    });
  }
})();
