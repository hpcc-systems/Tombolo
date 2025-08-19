import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';

export default function config({ mode }) {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    root: './',
    plugins: [
      react(),
      checker({
        eslint: {
          // Specify the files to lint
          files: './src/**/*.{js,jsx,ts,tsx}',
          // This ensures ESLint uses your .eslintrc.json
          lintCommand: 'eslint --config .eslintrc.json "./src/**/*.{js,jsx,ts,tsx}"',
        },
      }),
    ],
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
        '@': '/src', // Optional: for absolute imports (e.g., '@/components')
        '~': '/node_modules', // Alias for node_modules
      },
    },
    test: {
      environment: 'jsdom', // For React component testing
      globals: true, // Avoid importing `describe`, `it`, etc.
      setupFiles: './src/setupTests.js', // Optional for custom setup
    },
  });
}
