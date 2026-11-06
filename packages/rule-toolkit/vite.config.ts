import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { inlineSingleFile } from '../../tooling/vite-inline-single-file.ts';

const workspaceRoot = resolve(import.meta.dirname, '../..');

/**
 * Built file only: a strict Content-Security-Policy. The page may run its own inlined code and
 * styles and nothing else, and it cannot open any network connection (privacy-security.md).
 * Not applied in `npm run dev`, where Vite needs its own script and websocket.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'openbridge-toolkit-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ],
  };
}

/**
 * The toolkit only ships as one HTML file that opens from disk (file://), offline, with no
 * server. Everything (code, styles, rule data, and English copy) is inlined into it.
 */
export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), contentSecurityPolicy(), inlineSingleFile('OpenBridge-Rule-Toolkit.html')],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 4096,
    // No preload links exist in a single file; leaving the polyfill out keeps fetch() out too.
    modulePreload: { polyfill: false },
    rolldownOptions: { output: { codeSplitting: false } },
  },
  server: {
    host: '127.0.0.1',
    fs: {
      // Allow importing the versioned data/ JSON and web-app locale JSON from the workspace root.
      allow: [workspaceRoot],
    },
  },
});
