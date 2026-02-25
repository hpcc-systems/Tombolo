import { defineConfig } from 'tsup';
import { cp } from 'fs/promises';

export default defineConfig({
  entry: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!vitest.config.js',
    '!*.sample.js',
    '!tsx-worker-loader.mjs',
  ],
  format: ['esm'],
  dts: false, // Server doesn't need type declarations
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  shims: true,
  external: [/.*/], // Keep all imports external (server runs with node_modules)
  bundle: false, // Don't bundle - transpile each file individually, preserving structure
  onSuccess: async () => {
    await cp('notificationTemplates', 'dist/notificationTemplates', {
      recursive: true,
    });
    console.info('Copied notificationTemplates to dist/');
  },
});
