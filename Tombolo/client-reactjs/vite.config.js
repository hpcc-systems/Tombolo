import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import eslint from 'vite-plugin-eslint2';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default function config({ mode }) {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const isDev = mode === 'development';

  return defineConfig({
    root: './',
    base: '/', // Use absolute paths for assets to work on all routes
    plugins: [
      react(),
      eslint({
        lintInWorker: true, // Non-blocking (recommended)
        formatter: 'stylish', // or 'codeframe', 'visualstudio', etc.
        overrideConfigFile: './eslint.config.mjs',
        // Optional: only lint on save/start
        // lintOnStart: true,
      }),
    ].filter(Boolean),
    optimizeDeps: {
      include: [
        '@ant-design/plots',
        '@ant-design/charts',
        '@antv/g2',
        '@antv/component',
        '@antv/coord',
        '@antv/scale',
        'color-string',
      ],
    },
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
    server: {
      port: 3000, // Match CRA's default port
      open: true, // Auto-open browser like CRA
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_URL, // Use process.env for Node.js context
          changeOrigin: true, // Adjusts the Host header to match the target
          secure: false, // Disable SSL verification if needed (e.g., for self-signed certs)
        },
      },
      // Can be used to configure a custom proxy
      // configureServer(server) {
      //   handleProxy(server.middlewares, process.env.VITE_PROXY_URL);
      // },
    },
    resolve: {
      extensions: ['.js', '.jsx', '.css', '.module.css'],
      alias: {
        '@': path.resolve(__dirname, './src'), // Optional: for absolute imports (e.g., '@/components')
        '~': path.resolve(__dirname, '../../node_modules'), // Alias for node_modules (monorepo root)
      },
    },
    // Test configuration moved to vitest.config.js
    build: {
      outDir: 'build',
      sourcemap: isDev, // Enable sourcemaps in development
      rollupOptions: {
        output: {
          chunkFileNames: 'static/js/[name].chunk.js', // makes Dockerfile glob match
          manualChunks: undefined, // Let Vite handle chunk splitting automatically
        },
      },
    },
  });
}
