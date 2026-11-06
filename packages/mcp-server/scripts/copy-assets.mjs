/**
 * Copies the public reference data and the English locale into dist/assets/ so the built
 * package runs on its own (no repo checkout needed). Only rule data is copied: federal tables
 * and each state's adapter.json, never fixtures. dist/ is git-ignored at the repo root.
 */
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(PKG, '../..');
const OUT = resolve(PKG, 'dist/assets');

const LOCALE_NAMESPACES = ['reasons', 'factors', 'steps', 'math', 'common'];

rmSync(OUT, { recursive: true, force: true });

const federalOut = resolve(OUT, 'data/federal');
mkdirSync(federalOut, { recursive: true });
cpSync(resolve(REPO, 'data/federal'), federalOut, {
  recursive: true,
  filter: (src) => !src.includes('fixtures'),
});

const statesIn = resolve(REPO, 'data/states');
for (const entry of readdirSync(statesIn, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const adapter = resolve(statesIn, entry.name, 'adapter.json');
  if (!existsSync(adapter)) continue;
  const dest = resolve(OUT, 'data/states', entry.name);
  mkdirSync(dest, { recursive: true });
  cpSync(adapter, resolve(dest, 'adapter.json'));
}

const localeIn = resolve(REPO, 'packages/web-app/src/i18n/locales/en');
const localeOut = resolve(OUT, 'locales/en');
mkdirSync(localeOut, { recursive: true });
for (const ns of LOCALE_NAMESPACES) {
  cpSync(resolve(localeIn, `${ns}.json`), resolve(localeOut, `${ns}.json`));
}

// The bin entry must be executable when installed from a tarball or run directly.
const cli = resolve(PKG, 'dist/cli.js');
if (existsSync(cli)) chmodSync(cli, 0o755);
