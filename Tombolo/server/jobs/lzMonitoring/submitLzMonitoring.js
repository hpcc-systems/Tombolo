/* eslint-disable */
const models = require('../../models');
const { parentPort } = require('worker_threads');
const { decryptString } = require('../../utils/cipher');
const { FileSprayService } = require('@hpcc-js/comms');
const { getClusterOptions } = require('../../utils/getClusterOptions');
const path = require('path');

const {
  landingZoneMonitoring: LandingZoneMonitoring,
  cluster: Cluster,
  monitoring_types: MonitoringTypes,
  notification_queue: NotificationQueue,
} = models;

// Recursively list all files (no name filter)
async function listFilesRecursively(
  fss,
  dropzone,
  netaddr,
  currentPath,
  depth,
  maxDepth,
  pattern,
  clusterId,
  threshold,
  applicationId,
  contacts
) {
  if (depth > maxDepth) return [];
  const resp = await fss.FileList({
    DropZoneName: dropzone,
    Netaddr: netaddr,
    Path: currentPath,
    directoryOnly: false,
  });
  const entries = resp?.files?.PhysicalFileStruct || [];
  let results = [];
  for (const e of entries) {
    if (e.isDir) {
      // descend into sub-directory
      const subPath = path.posix.join(currentPath, e.name, '/');
      const subFiles = await listFilesRecursively(
        fss,
        dropzone,
        netaddr,
        subPath,
        depth + 1,
        maxDepth,
        pattern,
        clusterId,
        threshold,
        contacts,
        applicationId
      );
      results = results.concat(subFiles);
    } else {
      // record file only if it matches the wildcard pattern
      if (wildcardMatch(pattern, e.name)) {
        results.push({
          fileName: e.name,
          directory: currentPath,
          clusterId: clusterId,
          modifiedtime: e.modifiedtime,
          threshold,
          contacts,
          applicationId,
        });
      }
    }
  }
  return results;
}

// Match strings using * and ? wildcards
function wildcardMatch(pattern, str) {
  const escaped = pattern.replace(/[-\\/^$+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(
    '^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
  );
  return regex.test(str);
}

// Local time at cluster
function findLocalDateTimeAtCluster(timeZoneOffset) {
  const newDate = new Date();
  const localTime = new Date(newDate.getTime() + timeZoneOffset * 60 * 1000);
  return localTime;
}

const monitoring_name = 'Landing Zone Monitoring';

(async () => {
  // Get monitoring type ID for "Job Monitoring"
  const { id } = await MonitoringTypes.findOne({
    where: { name: monitoring_name },
    raw: true,
  });
  if (!id) {
    throw new Error(`Monitoring type ${monitoring_name} not found.`);
  }
  const monitoringTypeId = id;

  // Start time
  const startTime = new Date().getTime();
  try {
    parentPort.postMessage({
      level: 'info',
      text: `Landing Zone Monitoring started`,
    });

    // Get all lz monitoring with isActive = true and approvalStatus = approved
    const activeLzMonitorings = await LandingZoneMonitoring.findAll({
      where: {
        isActive: true,
        approvalStatus: 'approved',
      },
      include: [
        {
          model: Cluster,
          required: true,
          attributes: [
            'id',
            'thor_host',
            'thor_port',
            'username',
            'hash',
            'allowSelfSigned',
            'timezone_offset',
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    // If 0 activeLzMonitorings, log and return
    if (activeLzMonitorings.length === 0) {
      parentPort.postMessage({
        level: 'info',
        text: `No active landing zone monitoring found`,
      });
      return;
    }

    // TODO - This step should be eleminated when all lzMonitoringTypes are complete
    // Iterate over activeLzMonitorings, if none of them are lzMonitoringType = 'fileMovement' log and return
    const uniqueClusters = [];
    const monitoringsToEvaluate = [];
    activeLzMonitorings.forEach(lzMonitoring => {
      if (lzMonitoring.lzMonitoringType === 'fileMovement') {
        monitoringsToEvaluate.push(lzMonitoring);

        // Iterate over uniqueCluster arry and make sure lzMonitoring.clusterId is unique in there
        let isClusterIdUnique = true;
        uniqueClusters.forEach(c => {
          if (c.id == lzMonitoring.clusterId) {
            isClusterIdUnique = false;
          }
        });

        if (isClusterIdUnique) {
          let clusterPw;
          if (lzMonitoring.cluster.hash) {
            clusterPw = decryptString(lzMonitoring.cluster.hash);
          }
          uniqueClusters.push({ ...lzMonitoring.cluster, password: clusterPw });
        }
      }
    });

    // No eligible lzMonitoringTypes found
    if (monitoringsToEvaluate.length === 0) {
      parentPort.postMessage({
        level: 'info',
        text: `No active landing zone monitoring tracking file movement found`,
      });
      return;
    }

    parentPort.postMessage({
      level: 'info',
      text: `${monitoringsToEvaluate.length} active landing zone monitoring(s) tracking file movement`,
    });

    // create uniqueClustersObj for easy access
    const uniqueClustersObj = {};
    uniqueClusters.forEach(c => {
      uniqueClustersObj[c.id] = c;
    });

    // Iterate over monitoringsToEvaluate and make async place holder calls
    const allMatchedFiles = [];
    const filesThatPassedThreshold = [];

    for (const monitoring of monitoringsToEvaluate) {
      try {
        const {
          applicationId,
          clusterId,
          metaData: { monitoringData, contacts },
        } = monitoring;

        // Destructure monitoringData further
        const { dropzone, machine, directory, maxDepth, threshold, fileName } =
          monitoringData;

        // Get all the files in the directory plus all subdirectories until maxDepth
        const fss = new FileSprayService(
          getClusterOptions(
            {
              baseUrl: `${uniqueClustersObj[clusterId].thor_host}:${uniqueClustersObj[clusterId].thor_port}`,
              userID: uniqueClustersObj[clusterId].username || '',
              password: uniqueClustersObj[clusterId].password || '',
            },
            uniqueClustersObj[clusterId].allowSelfSigned
          )
        );

        // get only matching files
        const matches = await listFilesRecursively(
          fss,
          dropzone,
          machine,
          directory,
          1,
          maxDepth,
          fileName,
          clusterId,
          threshold,
          contacts,
          applicationId
        );

        allMatchedFiles.push(...matches);
      } catch (error) {
        parentPort.postMessage({
          level: 'error',
          text: `Error while getting files from File Spray service: ${error.message}`,
        });
      }

      // Iterate over allMatchedFiles and evaluate whether the file has passed the threshold
      for (let f of allMatchedFiles) {
        const { fileName, directory, clusterId, modifiedtime, threshold } = f;
        const clusterOffset = uniqueClustersObj[clusterId].timezone_offset;
        const localTimeAtCluster = findLocalDateTimeAtCluster(clusterOffset);
        // compute age of file in ms and compare to threshold (minutes)
        const fileDate = new Date(modifiedtime);
        const ageMs = localTimeAtCluster - fileDate;
        const thresholdMs = threshold * 60 * 1000;
        if (ageMs > thresholdMs) {
          filesThatPassedThreshold.push({
            ...f,
            ageInMins: ageMs / 60000,
            clusterName: uniqueClustersObj[clusterId].name,
          });
        }
      }
    }

    // Queue notification for each file that passed the threshold
    parentPort.postMessage({
      level: 'info',
      text: `Queing notification for ${filesThatPassedThreshold.length} file(s) that passed the threshold`,
    });
  } catch (error) {
    // Log error
    parentPort.postMessage({
      level: 'error',
      text: `Error while monitoring landing zone: ${error.message}`,
    });
  } finally {
    // End time
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    parentPort.postMessage({
      level: 'info',
      text: `Landing Zone Monitoring completed in ${duration} ms`,
    });
  }
})();
