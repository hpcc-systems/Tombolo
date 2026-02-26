import { createLogger } from '@tombolo/shared/backend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logger instance with server-specific configuration
const logger = createLogger({
  logDir: path.join(__dirname, '..', 'logs'), // Absolute path to server/logs
});

export default logger;
