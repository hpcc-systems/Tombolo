import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import eslint from 'vite-plugin-eslint2';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default function config({ mode }: { mode: string }) {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const isDev = mode === 'development';

  return defineConfig({
    root: './',
    base: '/',
    plugins: [
      react(),
      eslint({
        lintInWorker: true, // Non-blocking (recommended)
        formatter: 'stylish',
        overrideConfigFile: './eslint.config.mjs',
      }),
    ].filter(Boolean),
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: [
        'monaco-editor',
        '@ant-design/plots',
        '@ant-design/charts',
        '@antv/g2',
        '@antv/component',
        '@antv/coord',
        '@antv/scale',
        'color-string',
        'monaco-editor',
      ],
    },
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, '../../node_modules'),
      },
    },
    build: {
      outDir: 'build',
      sourcemap: isDev,
      rollupOptions: {
        output: {
          chunkFileNames: 'static/js/[name].chunk.js',
          manualChunks: {
            monaco: ['monaco-editor'],
          },
        },
      },
    },
  });
}
