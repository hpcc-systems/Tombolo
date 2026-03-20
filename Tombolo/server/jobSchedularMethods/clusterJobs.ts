import { join } from 'path';
import { resolveJobPath } from './jobPathResolver.js';

//Local imports
import logger from '../config/logger.js';
import {
  clusterReachabilityMonitoringInterval,
  cluster_monitoring_interval,
  clusterContainerizationCheckInterval,
} from '../config/monitorings.js';
import { getDirname } from '../utils/polyfills.js';

// Constants
const __dirname = getDirname(import.meta.url);
const CLUSTER_MONITORING_FILE_NAME = 'clusterMonitoring.js';
const CLUSTER_TIMEZONE_OFFSET = 'clustertimezoneoffset.js';
const CLUSTER_USAGE_HISTORY_TRACKER = 'submitClusterUsageTracker.js';
const MONITOR_CLUSTER_REACHABILITY_FILE_NAME = 'monitorClusterReachability.js';
const CHECK_CLUSTER_CONTAINERIZATION_FILE_NAME =
  'checkIfClusterIsContainerized.js';

// Cluster status monitoring bree job
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function startClusterMonitoring(this: any): Promise<void> {
  try {
    const jobName = 'cluster-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: '10s', // For development
      interval: `${cluster_monitoring_interval}m`,
      path: resolveJobPath(
        join(__dirname, '..', 'jobs', 'cluster', CLUSTER_MONITORING_FILE_NAME)
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Cluster  monitoring job initialized ...');
  } catch (err) {
    logger.error(err.message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scheduleClusterTimezoneOffset(this: any): Promise<void> {
  logger.info('Cluster timezone offset checker job initialized ...');
  try {
    const jobName = 'cluster-timezone-offset-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      interval: 'at 02:30am also at 02:30pm',
      path: resolveJobPath(
        join(__dirname, '..', 'jobs', 'cluster', CLUSTER_TIMEZONE_OFFSET)
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });

    this.bree.start(jobName);
  } catch (err) {
    logger.error('clusterJobs - scheduleClusterTimezoneOffset: ', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createClusterUsageHistoryJob(this: any): Promise<void> {
  const uniqueJobName = 'Cluster Usage History Tracker';
  const job = {
    interval: 14400000, // 4 hours
    // interval: "10s", // For development
    name: uniqueJobName,
    path: resolveJobPath(
      join(__dirname, '..', 'jobs', 'cluster', CLUSTER_USAGE_HISTORY_TRACKER)
    ),
  };
  this.bree.add(job);
  this.bree.start(uniqueJobName);
  logger.info('Cluster usage monitoring job initialized ...');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkClusterReachability(this: any): Promise<void> {
  try {
    const jobName = 'cluster-reachability-monitoring' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: "10s", // For development
      interval: clusterReachabilityMonitoringInterval,
      path: resolveJobPath(
        join(
          __dirname,
          '..',
          'jobs',
          'cluster',
          MONITOR_CLUSTER_REACHABILITY_FILE_NAME
        )
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Cluster reachability checker job initialized ...');
  } catch (err) {
    logger.error('clusterJobs - checkClusterReachability: ', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkClusterContainerization(this: any): Promise<void> {
  try {
    const jobName = 'cluster-containerization-check-' + new Date().getTime();
    this.bree.add({
      name: jobName,
      // interval: '10s', // For development
      cron: clusterContainerizationCheckInterval,
      path: resolveJobPath(
        join(
          __dirname,
          '..',
          'jobs',
          'cluster',
          CHECK_CLUSTER_CONTAINERIZATION_FILE_NAME
        )
      ),
      worker: {
        workerData: {
          jobName: jobName,
          WORKER_CREATED_AT: Date.now(),
          isCronJob: true,
        },
      },
    });
    this.bree.start(jobName);
    logger.info('Cluster containerization check job initialized ...');
  } catch (err) {
    logger.error('clusterJobs - checkClusterContainerization: ', err);
  }
}

export {
  scheduleClusterTimezoneOffset,
  createClusterUsageHistoryJob,
  checkClusterReachability,
  checkClusterContainerization,
  startClusterMonitoring,
};
