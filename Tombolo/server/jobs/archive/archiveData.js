const { CostMonitoringDataArchiveService } = require('../../services');
const { sequelize } = require('../../models');
const { parentPort } = require('worker_threads');

const costMonitoringArchiveService = new CostMonitoringDataArchiveService(
  sequelize
);

async function runCostMonitoringDataArchive() {
  try {
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: 'Starting cost monitoring archive job...',
      });

    // Archive old data (keep 30 days)
    const archivedCount =
      await costMonitoringArchiveService.archiveOldCostData(30);

    // Clean up old archives (keep 1 year in the archive)
    const cleanedCount =
      await costMonitoringArchiveService.cleanupOldArchives(365);

    // Log statistics
    const stats = await costMonitoringArchiveService.getArchiveStats();
    const statOutput = {
      archivedRecords: archivedCount,
      cleanedRecords: cleanedCount,
      archiveStats: stats,
    };
    parentPort &&
      parentPort.postMessage({
        level: 'info',
        text: `Cost Monitoring Data Archive job completed. Stats: ${JSON.stringify(statOutput)}`,
      });

    return { archivedCount, cleanedCount, stats };
  } catch (error) {
    parentPort &&
      parentPort.postMessage({
        level: 'error',
        text: `costMonitoringData Archive: Archive job failed: ${error.message}`,
      });
  }
}

(async () => {
  await runCostMonitoringDataArchive();
})();
