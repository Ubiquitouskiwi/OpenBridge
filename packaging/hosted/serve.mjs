#!/usr/bin/env node
/**
 * OpenBridge static server (no dependencies; Node 20+).
 *
 * Serves the built app in ./site with single-page-app fallback and security headers. The
 * app is static: this server never receives or stores personal data, and it writes no
 * request logs.
 *
 *   node serve.mjs                 # http://127.0.0.1:8080 (this computer only)
 *   PORT=3000 node serve.mjs
 *   HOST=0.0.0.0 node serve.mjs    # reachable by other machines; put HTTPS in front
 *
 * HOST defaults to loopback on purpose. Exposing it is your decision: for a public site, run
 * it behind a reverse proxy that terminates HTTPS (see README.md), or use nginx or Caddy.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), 'site');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number.parseInt(process.env.PORT || '8080', 10);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// Keep in sync with nginx.conf and Caddyfile. Everything ships in the bundle, so nothing
// outside this origin is needed (privacy model: no third-party scripts, fonts, or beacons).
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob:; " +
    "worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; " +
    "form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/** Map a URL path to a file inside ROOT, or null if it would escape ROOT. */
function toFilePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const candidate = normalize(join(ROOT, decoded));
  return candidate === ROOT || candidate.startsWith(ROOT + sep) ? candidate : null;
}

async function resolveFile(urlPath) {
  const filePath = toFilePath(urlPath);
  if (!filePath) return null;
  try {
    const info = await stat(filePath);
    if (info.isFile()) return filePath;
    if (info.isDirectory()) return resolveFile(join(urlPath, 'index.html'));
  } catch {
    // Fall through to the SPA fallback below.
  }
  // Client-side routes (no file extension) get the app shell; missing assets get a 404.
  return extname(urlPath) === '' ? join(ROOT, 'index.html') : null;
}

function cacheControl(filePath) {
  const name = filePath.slice(ROOT.length);
  if (name.startsWith(`${sep}assets${sep}`)) return 'public, max-age=31536000, immutable';
  return 'no-cache';
}

const server = createServer(async (req, res) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(key, value);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const { pathname } = new URL(req.url || '/', 'http://localhost');
  const filePath = await resolveFile(pathname);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': cacheControl(filePath),
      'Content-Length': body.length,
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Server error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`OpenBridge is running at http://${HOST}:${PORT}`);
  if (HOST !== '127.0.0.1' && HOST !== 'localhost' && HOST !== '::1') {
    console.log('Reachable from other machines. Serve it over HTTPS for public use.');
  }
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
