import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../client/dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8742',
      '/socket.io': {
        target: 'http://localhost:8742',
        ws: true,
      },
    },
  },
});
