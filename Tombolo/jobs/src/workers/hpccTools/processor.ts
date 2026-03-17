import { Job } from 'bullmq';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import logger from '../../config/logger.js';

/**
 * Job processor for cloning/updating hpcc-tools repo
 */
export default async function processHpccToolsJob(job: Job) {
  const { id } = job;
  logger.info(`Processing hpcc-tools job`, { jobId: id });

  // Repository details
  const repoUrl = 'https://github.com/hpcc-systems/hpcc-tools.git';
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

    if (!fs.existsSync(repoDir)) {
      // Clone if doesn't exist
      logger.info(`Cloning repo ${repoUrl} into ${repoDir}`);
      execSync(`git clone ${repoUrl} ${repoDir}`, {
        stdio: 'inherit',
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      });
    } else {
      // Pull if exists
      logger.info(`Updating repo in ${repoDir}`);
      execSync('git pull', {
        cwd: repoDir,
        stdio: 'inherit',
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
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
