import { CostMonitoringDataArchiveService, sequelize } from '@tombolo/db';
import logger from '@/config/logger.js';
import type { ArchiveJobData } from '@/types/index.js';

const archiveService = new CostMonitoringDataArchiveService(sequelize, logger);

export async function runCostMonitoringArchive(job: ArchiveJobData): Promise<{
  archivedRecords: number;
  cleanedRecords: number;
  archiveStats: {
    totalRecords: number;
    oldestArchive: Date | null;
    latestArchive: Date | null;
    uniqueClusters: number;
  };
}> {
  const daysToKeep = job.daysToKeep ?? 30;
  const retentionDays = job.retentionDays ?? 365;

  logger.info('Starting cost monitoring archive job', {
    daysToKeep,
    retentionDays,
  });

  const archivedCount = await archiveService.archiveOldCostData(daysToKeep);
  const cleanedCount = await archiveService.cleanupOldArchives(retentionDays);
  const stats = await archiveService.getArchiveStats();

  return {
    archivedRecords: archivedCount,
    cleanedRecords: cleanedCount,
    archiveStats: stats,
  };
}
