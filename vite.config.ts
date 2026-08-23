import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const DEV_API = 'http://localhost:8081';
const PROD_API = 'https://idbi-demo.onrender.com';

export default defineConfig(({ mode }) => {
  const apiBaseUrl = mode === 'development' ? DEV_API : PROD_API;

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: DEV_API,
          changeOrigin: true,
          secure: false,
          ws: true,
          timeout: 0,
          proxyTimeout: 0,
        },
      },
    },
  };
});
