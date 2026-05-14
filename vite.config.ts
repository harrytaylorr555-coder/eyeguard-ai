import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/webapp',
  publicDir: '../../public',
  build: {
    outDir: '../../dist/webapp',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/webapp'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
