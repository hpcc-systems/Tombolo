import fs from 'fs';
import path from 'path';
import { getDirname } from './polyfills.js';

const __dirname = getDirname(import.meta.url);

// Auto-detect if running TS or JS files by checking if a known job file exists as .ts
const jobsDir = path.join(__dirname, '..', 'jobs');
const isTypeScript = fs.existsSync(path.join(jobsDir, 'statusPoller.ts'));

export const JOB_EXTENSION = isTypeScript ? 'ts' : 'js';

export const getJobFileName = (name: string): string =>
  `${name}.${JOB_EXTENSION}`;
