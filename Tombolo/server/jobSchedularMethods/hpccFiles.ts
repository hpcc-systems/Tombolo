import { join } from 'path';

import { FileMonitoring } from '../models/index.js';
import { getDirname } from '../utils/polyfills.js';
import logger from '../config/logger.js';
import { resolveJobPath } from './jobPathResolver.js';

const __dirname = getDirname(import.meta.url);
const SUBMIT_LANDINGZONE_FILEMONITORING_FILE_NAME =
  'submitLandingZoneFileMonitoring.js';
const SUBMIT_LOGICAL_FILEMONITORING_FILE_NAME =
  'submitLogicalFileMonitoring.js';
// const FILE_MONITORING = `fileMonitoringPoller.${JOB_EXTENSION}`;

async function createLandingZoneFileMonitoringBreeJob(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  {
    filemonitoring_id,
    name,
    cron,
  }: { filemonitoring_id: string; name: string; cron: string }
): Promise<void> {
  const defaultDistPath = join(
    __dirname,
    '..',
    '..',
    'dist',
    'jobs',
    SUBMIT_LANDINGZONE_FILEMONITORING_FILE_NAME.replace('.ts', '.js')
  );
  const job = {
    cron,
    name,
    path: resolveJobPath(defaultDistPath),
    worker: {
      workerData: { filemonitoring_id },
    },
  };
  await this.bree.add(job);
}

async function createLogicalFileMonitoringBreeJob(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  {
    filemonitoring_id,
    name,
    cron,
  }: { filemonitoring_id: string; name: string; cron: string }
): Promise<void> {
  const defaultDistPath2 = join(
    __dirname,
    '..',
    '..',
    'dist',
    'jobs',
    SUBMIT_LOGICAL_FILEMONITORING_FILE_NAME.replace('.ts', '.js')
  );
  const job = {
    cron,
    name,
    path: resolveJobPath(defaultDistPath2),
    worker: {
      workerData: { filemonitoring_id },
    },
  };
  await this.bree.add(job);
}

async function scheduleFileMonitoringBreeJob(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  {
    filemonitoring_id,
    name,
    cron,
    monitoringAssetType,
  }: {
    filemonitoring_id: string;
    name: string;
    cron: string;
    monitoringAssetType: string;
  }
): Promise<void> {
  if (monitoringAssetType === 'landingZoneFile') {
    await createLandingZoneFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      name,
      cron,
    });
  } else if (monitoringAssetType === 'logicalFile') {
    await createLogicalFileMonitoringBreeJob.call(this, {
      filemonitoring_id,
      name,
      cron,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scheduleFileMonitoringOnServerStart(this: any): Promise<void> {
  try {
    const activeLandingZoneFileMonitoring = (await FileMonitoring.findAll({
      where: {
        monitoringActive: true,
        // monitoringAssetType: "landingZoneFile",
      },
      raw: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any[];
    for (const monitoring of activeLandingZoneFileMonitoring) {
      await this.scheduleFileMonitoringBreeJob({
        filemonitoring_id: monitoring.id,
        name: monitoring.name,
        cron: monitoring.cron,
        monitoringAssetType: monitoring.monitoringAssetType,
      });
    }
  } catch (err) {
    logger.error('hpccFiles - scheduleFileMonitoringOnServerStart: ', err);
  }
}

// async function scheduleFileMonitoring(this: any): Promise<void> {
//   logger.info('File monitoring initialized ...');
//   try {
//     let jobName = 'file-monitoring-' + new Date().getTime();
//     this.bree.add({
//       name: jobName,
//       interval: '500s',
//       path: join(__dirname, '..', 'jobs', FILE_MONITORING),
//       worker: {
//         workerData: {
//           jobName: jobName,
//           WORKER_CREATED_AT: Date.now(),
//         },
//       },
//     });

//     this.bree.start(jobName);
//   } catch (err) {
//     logger.error('hpccFiles - scheduleFileMonitoring: ', err);
//   }
// }

export {
  createLandingZoneFileMonitoringBreeJob,
  createLogicalFileMonitoringBreeJob,
  scheduleFileMonitoringBreeJob,
  scheduleFileMonitoringOnServerStart,
  // scheduleFileMonitoring,
};
