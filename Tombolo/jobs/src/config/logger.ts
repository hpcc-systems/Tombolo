import { createLogger } from '@tombolo/shared';
import { fileURLToPath } from 'url';
import path from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger({
  logDir: process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs'), // Tombolo/jobs/logs
  serviceName: 'jobs',
});

export default logger;
