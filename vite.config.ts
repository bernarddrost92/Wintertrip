import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Base path is set via env so GitHub Pages project sites (user.github.io/repo/)
// resolve assets correctly. Locally / on custom domains this stays "/".
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
