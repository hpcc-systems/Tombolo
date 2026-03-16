/**
 * Preload script that registers tsx ESM hooks in worker threads.
 *
 * tsx only auto-registers its resolve/load hooks on the main thread
 * (it checks `isMainThread` and skips workers). This breaks .js → .ts
 * import resolution in Bree job workers.
 *
 * Load this via --import in worker execArgv:
 *   execArgv: ['--import', './tsx-worker-loader.mjs']
 */
import { register } from 'node:module';
import { isMainThread } from 'node:worker_threads';

if (!isMainThread) {
  register('tsx/esm', {
    parentURL: import.meta.url,
    data: { namespace: undefined },
  });
}
