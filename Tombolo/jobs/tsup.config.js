import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/app.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  shims: true,
  bundle: true,
  // Externalize all npm packages (unscoped like "bullmq" and scoped like "@hpcc-js/comms")
  // but not path aliases like "@/..." which esbuild resolves to local files during bundling.
  external: [/^[a-z]/, /^@[a-z]/],
});
