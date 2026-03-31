import { Job } from 'bullmq';
import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import db from '@tombolo/db';
import logger from '../../config/logger.js';

const { Integration, IntegrationMapping } = db;

/**
 * Job processor for cloning/updating hpcc-tools repo
 */
export default async function processHpccToolsJob(job: Job) {
  const { id } = job;
  logger.info(`Processing hpcc-tools job`, { jobId: id });

  // Check if the HPCC-Tools integration is enabled for any application
  const integration = await Integration.findOne({
    where: { name: 'HPCC-Tools' },
  });
  if (integration) {
    const mapping = await IntegrationMapping.findOne({
      where: { integration_id: integration.id },
    });
    if (!mapping) {
      logger.info('HPCC-Tools integration not enabled, skipping job', {
        jobId: id,
      });
      return { success: false, reason: 'integration_disabled' };
    }
  }

  // Repository details
  const repoUrl =
    process.env.HPCC_TOOLS_REPO_URL ||
    'ssh://git@ssh.github.com:443/hpcc-systems/hpcc-tools.git';
  // In Docker the repo lives on the shared named volume at /app/hpcc-tools-data.
  // Outside Docker it lives as a sibling to the jobs package directory.
  const parentDir = fs.existsSync('/.dockerenv')
    ? '/app/hpcc-tools-data'
    : path.resolve(process.cwd(), '..', 'hpcc-tools');
  const repoDir = path.join(parentDir, 'hpcc-tools');

  try {
    // Ensure parent directory exists
    if (!fs.existsSync(parentDir)) {
      logger.info(`Creating parent directory: ${parentDir}`);
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const gitEnv = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
    const timeout = 5 * 60 * 1000; // 5 minutes

    if (!fs.existsSync(repoDir)) {
      // Clone if doesn't exist
      logger.info(`Cloning repo ${repoUrl} into ${repoDir}`);
      execFileSync('git', ['clone', repoUrl, repoDir], {
        stdio: 'inherit',
        env: gitEnv,
        timeout,
      });
    } else {
      // Pull if exists
      logger.info(`Updating repo in ${repoDir}`);
      execFileSync('git', ['pull', '--ff-only'], {
        cwd: repoDir,
        stdio: 'inherit',
        env: gitEnv,
        timeout,
      });
    }

    // Apply patches after clone or pull
    // applyPatches(repoDir);

    logger.info('hpcc-tools job completed successfully');
    return { success: true, path: repoDir };
  } catch (error) {
    logger.error('hpcc-tools job failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
