import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  shims: true,
  bundle: true,
  external: [
    'sequelize',
    'sequelize-typescript',
    'mysql2',
    'reflect-metadata',
    'dotenv',
    '@tombolo/shared',
    '@tombolo/shared/backend',
  ],
  noExternal: [],
});
