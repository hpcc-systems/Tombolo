import { Job } from 'bullmq';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import logger from '../../config/logger.js';

/**
 * Applies patches to the cloned repo to make it work within Tombolo's iframe/API structure
 */
function applyPatches(repoDir: string) {
  const docsDir = path.join(repoDir, 'docs');
  const apiBasePath = '/api/hpcc-tools-docs';

  logger.info(`Applying patches to documentation in ${docsDir}`);

  // 1. Patch DataLoader.js to use an absolute default manifest path
  const dataLoaderPath = path.join(docsDir, 'js', 'data-loader.js');
  if (fs.existsSync(dataLoaderPath)) {
    let content = fs.readFileSync(dataLoaderPath, 'utf8');
    content = content.replace(
      "let manifestPath = 'data/azure/manifest.json';",
      `let manifestPath = '${apiBasePath}/data/azure/manifest.json';`
    );
    fs.writeFileSync(dataLoaderPath, content);
    logger.info('Patched DataLoader.js');
  }

  // 2. Patch all HTML files
  const patchHtmlFiles = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        patchHtmlFiles(fullPath);
      } else if (file.endsWith('.html')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        // Replace relative manifest paths with absolute ones in setManifestPath calls
        // Matches: DataLoader.setManifestPath('../data/azure/manifest.json');
        // Matches: DataLoader.setManifestPath('data/azure/manifest.json');
        const setManifestRegex = /DataLoader\.setManifestPath\(['"](?:\.\.\/)?(data\/azure\/.*?manifest\.json)['"]\)/g;
        if (setManifestRegex.test(content)) {
          content = content.replace(setManifestRegex, `DataLoader.setManifestPath('${apiBasePath}/$1')`);
          modified = true;
        }

        // Special fixes for components.html (it has unique data loading patterns)
        if (file === 'components.html') {
          // Fix loadComponentData to use its specific manifest
          const componentManifestPath = `${apiBasePath}/data/azure/component_costs/manifest.json`;
          if (!content.includes(`DataLoader.setManifestPath('${componentManifestPath}');`)) {
            // Match "async function loadComponentData(..." with any parameter name
            content = content.replace(
              /(\s*)async function loadComponentData\s*\(([^)]*)\)\s*\{/g,
              `$1async function loadComponentData($2) {\n$1    DataLoader.setManifestPath('${componentManifestPath}');`
            );
            modified = true;

            // Fix loadSkuCostData
            content = content.replace(
              /(\s*)async function loadSkuCostData\s*\(([^)]*)\)\s*\{/g,
              `$1async function loadSkuCostData($2) {\n$1    DataLoader.setManifestPath('${componentManifestPath}');`
            );
          }

          // Fix loadDetailedData to use its specific manifest
          const podManifestPath = `${apiBasePath}/data/azure/pod_costs/manifest.json`;
          if (!content.includes(`async function loadDetailedData() {\n    DataLoader.setManifestPath('${podManifestPath}');`)) {
            content = content.replace(
              /(\s*)async function loadDetailedData\s*\(([^)]*)\)\s*\{/g,
              `$1async function loadDetailedData($2) {\n$1    DataLoader.setManifestPath('${podManifestPath}');`
            );
            modified = true;
          }
        }

        if (modified) {
          fs.writeFileSync(fullPath, content);
          logger.info(`Patched ${path.relative(docsDir, fullPath)}`);
        }
      }
    }
  };
  patchHtmlFiles(docsDir);
}

/**
 * Job processor for cloning/updating hpcc-tools repo
 */
export default async function processHpccToolsJob(job: Job) {
  const { id } = job;
  logger.info(`Processing hpcc-tools job`, { jobId: id });

  // Repository details
  const repoUrl = 'https://github.com/hpcc-systems/hpcc-tools.git';
  // Root of the Tombolo folder (assuming we are running from Tombolo/jobs)
  const tomboloRoot = path.resolve(process.cwd(), '..');
  const parentDir = path.join(tomboloRoot, 'hpcc-tools');
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
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
      });
    } else {
      // Pull if exists
      logger.info(`Updating repo in ${repoDir}`);
      execSync('git pull', {
        cwd: repoDir,
        stdio: 'inherit',
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
      });
    }

    // Apply patches after clone or pull
    // applyPatches(repoDir);

    logger.info('hpcc-tools job completed successfully');
    return { success: true, path: repoDir };
  } catch (error) {
    logger.error('hpcc-tools job failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
