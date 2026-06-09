import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Inside Docker the backend is reachable as `http://backend:4000`; for local
// dev it's `http://localhost:4000`. Override with VITE_PROXY_TARGET.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: proxyTarget, changeOrigin: true },
      '/socket.io': { target: proxyTarget, ws: true },
    },
  },
});
