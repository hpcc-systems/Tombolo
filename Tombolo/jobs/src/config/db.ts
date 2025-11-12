import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from Tombolo/.env (where docker-compose is) or local .env
const tomboloENV = path.join(__dirname, '..', '..', '..', '.env'); // Tombolo/.env
const jobsENV = path.join(process.cwd(), '.env'); // Tombolo/jobs/.env
const ENVPath = fs.existsSync(tomboloENV) ? tomboloENV : jobsENV;

console.log('Loading .env from:', ENVPath); // Debug log
dotenv.config({ path: ENVPath });

// Construct MySQL connection URL with proper validation
const DB_USERNAME = process.env.DB_USERNAME || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOSTNAME = process.env.DB_HOSTNAME || 'localhost';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_NAME = process.env.DB_NAME || 'tombolo';

export const DB_URL = `mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOSTNAME}:${DB_PORT}/${DB_NAME}`;

console.log(
  'Database URL (password hidden):',
  DB_URL.replace(/:([^@]+)@/, ':****@'),
);
