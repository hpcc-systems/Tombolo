import { defineConfig } from 'tsup';
import { cp } from 'fs/promises';

export default defineConfig({
  entry: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!node_modules/**',
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
  external: [/^[^./]/], // Externalize bare module imports (node_modules), not relative paths
  bundle: false, // Don't bundle - transpile each file individually, preserving structure
  onSuccess: async () => {
    await cp('notificationTemplates', 'dist/notificationTemplates', {
      recursive: true,
    });
    console.info('Copied notificationTemplates to dist/');
  },
});
