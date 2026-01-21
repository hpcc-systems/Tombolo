import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Look for .env file in parent directory (monorepo root) or current directory
const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
dotenv.config({ path: ENVPath });

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
