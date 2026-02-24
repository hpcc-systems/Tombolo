import fs from 'fs';
import path from 'path';

/**
 * Resolves Bree job file paths for dev vs production.
 *
 * In production, paths point to compiled JS under dist/ and are returned as-is.
 * In development, paths are remapped:
 *   - dist/jobs/... → server/jobs/... (or jobs/...)
 *   - .js → .ts (since source files are TypeScript)
 */
export function resolveJobPath(p: string): string {
  // Production: use path as-is (compiled JS under dist/)
  if (process.env.NODE_ENV === 'production') return p;

  // If path already exists on disk, return it
  if (fs.existsSync(p)) return p;

  // Try swapping .js → .ts at the same location
  if (p.endsWith('.js')) {
    const tsCandidate = p.replace(/\.js$/, '.ts');
    if (fs.existsSync(tsCandidate)) return tsCandidate;
  }

  // Map dist/jobs/... → server/jobs/... or jobs/... for dev layout
  const distJobsPattern = new RegExp(
    `${path.sep}?dist${path.sep}jobs${path.sep}`
  );
  if (distJobsPattern.test(p)) {
    const candidates = [
      p.replace(distJobsPattern, `${path.sep}server${path.sep}jobs${path.sep}`),
      p.replace(distJobsPattern, `${path.sep}jobs${path.sep}`),
    ];
    for (const devPath of candidates) {
      if (fs.existsSync(devPath)) return devPath;
      if (devPath.endsWith('.js')) {
        const devTs = devPath.replace(/\.js$/, '.ts');
        if (fs.existsSync(devTs)) return devTs;
      }
    }
  }

  // Try swapping .js → .ts for paths that already point at jobs/ (no dist)
  if (p.includes(`${path.sep}jobs${path.sep}`) && p.endsWith('.js')) {
    const alt = p.replace(/\.js$/, '.ts');
    if (fs.existsSync(alt)) return alt;
  }

  // Last resort: return original path
  return p;
}
