import { existsSync } from 'fs';
import { sep as pathSep } from 'path';

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
  if (existsSync(p)) return p;

  // Try swapping .js → .ts at the same location
  if (p.endsWith('.js')) {
    const tsCandidate = p.replace(/\.js$/, '.ts');
    if (existsSync(tsCandidate)) return tsCandidate;
  }

  // Map dist/jobs/... → server/jobs/... or jobs/... for dev layout
  const distJobsPattern = new RegExp(`${pathSep}?dist${pathSep}jobs${pathSep}`);
  if (distJobsPattern.test(p)) {
    const candidates = [
      p.replace(distJobsPattern, `${pathSep}server${pathSep}jobs${pathSep}`),
      p.replace(distJobsPattern, `${pathSep}jobs${pathSep}`),
    ];
    for (const devPath of candidates) {
      if (existsSync(devPath)) return devPath;
      if (devPath.endsWith('.js')) {
        const devTs = devPath.replace(/\.js$/, '.ts');
        if (existsSync(devTs)) return devTs;
      }
    }
  }

  // Try swapping .js → .ts for paths that already point at jobs/ (no dist)
  if (p.includes(`${pathSep}jobs${pathSep}`) && p.endsWith('.js')) {
    const alt = p.replace(/\.js$/, '.ts');
    if (existsSync(alt)) return alt;
  }

  // Last resort: return original path
  return p;
}
