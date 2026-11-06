import { resolve } from 'node:path';
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { inlineSingleFile } from '../../tooling/vite-inline-single-file.ts';

const workspaceRoot = resolve(import.meta.dirname, '../..');

/** Installable, offline-capable PWA for hosted deployments. */
function pwa(): PluginOption {
  return VitePWA({
    registerType: 'prompt',
    workbox: {
      globPatterns: ['**/*.{js,css,html,json,svg,png,woff2}'],
    },
    manifest: {
      name: 'OpenBridge',
      short_name: 'OpenBridge',
      description: 'Check which benefit programs you may qualify for.',
      theme_color: '#0b5cad',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      // Logo icons (docs/brand). The maskable one keeps the bridge inside the safe zone so
      // Android's round and squircle crops never cut it off.
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: '/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
  });
}

export default defineConfig(({ mode }) => {
  // `vite build --mode standalone` makes the single-file download that opens from disk. It has no
  // service worker (not available on file://) and no public/ files (nothing can fetch them).
  const local = mode === 'standalone';
  return {
    base: local ? './' : '/',
    publicDir: local ? false : 'public',
    plugins: [react(), local ? inlineSingleFile() : pwa()],
    build: local
      ? {
          outDir: 'dist-local',
          emptyOutDir: true,
          cssCodeSplit: false,
          assetsInlineLimit: Number.MAX_SAFE_INTEGER,
          chunkSizeWarningLimit: 4096,
          // One bundle: the lazily loaded PDF code is folded in so nothing loads from disk.
          rolldownOptions: { output: { codeSplitting: false } },
        }
      : {},
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
  };
});
