import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'index.ts',
    backend: 'backend.ts',
    browser: 'browser.ts',
  },
  format: ['cjs', 'esm'],
  dts: true, // Generate TypeScript declarations
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});
