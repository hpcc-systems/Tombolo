import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';

const hpccToolsDir = fs.existsSync('/.dockerenv')
  ? '/app/hpcc-tools-data'
  : path.join(process.cwd(), '..', 'hpcc-tools');

export const hpccToolsDocsDir = path.join(hpccToolsDir, 'hpcc-tools', 'docs');

export const checkAvailability = (_req: Request, res: Response): void => {
  res.json({ available: fs.existsSync(hpccToolsDocsDir) });
};
