import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external: ['sequelize', 'mysql2', 'dotenv'],
  bundle: false, // Don't bundle, just transpile
  skipNodeModulesBundle: true,
});
