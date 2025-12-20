import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'index.js',
    backend: 'backend.js',
    browser: 'browser.js',
  },
  format: ['cjs', 'esm'],
  dts: true, // Generate TypeScript declarations
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});
