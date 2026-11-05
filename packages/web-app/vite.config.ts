import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const workspaceRoot = resolve(__dirname, '../..');

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,woff2}'],
      },
      manifest: {
        name: 'OpenBridge',
        short_name: 'OpenBridge',
        description: 'Check which benefit programs you may qualify for.',
        theme_color: '#0b5cad',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
    }),
  ],
  server: {
    fs: {
      // Allow importing the versioned data/ JSON that lives at the workspace root.
      allow: [workspaceRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
