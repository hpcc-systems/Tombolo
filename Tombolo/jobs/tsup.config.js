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
  external: [
    'bullmq',
    'ioredis',
    'express',
    'mysql2',
    'dotenv',
    '@tombolo/core',
    '@tombolo/db',
    '@tombolo/shared',
  ],
});
