import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server.ts'],
  format: ['esm'],
  dts: false, // Server doesn't need type declarations
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  shims: true,
  noExternal: [], // Don't bundle node_modules
  external: [/.*/], // Keep all imports external (server runs with node_modules)
  bundle: false, // Don't bundle - preserve file structure
});
