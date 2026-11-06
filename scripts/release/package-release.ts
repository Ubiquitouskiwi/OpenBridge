/**
 * Assembles the release downloads from build output (see docs/RELEASING.md):
 *
 *   openbridge-hosted-v<version>.tar.gz   static site + server examples, for hosting
 *   openbridge-local-v<version>.zip       single-file app, double-click to run offline
 *   openbridge-rule-toolkit-v<version>.zip single-file tools for policy and legal experts
 *   SHA256SUMS.txt                        checksums for every download
 *
 * Prerequisites: `npm run build` (hosted site in packages/web-app/dist and the toolkit in
 * packages/rule-toolkit/dist) and `npm run build:local -w @openbridge/web-app` (local,
 * packages/web-app/dist-local).
 *
 * Usage: tsx scripts/release/package-release.ts [--version 1.2.3]
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'release-artifacts');
const STAGING = join(OUT, 'staging');
const HOSTED_BUILD = join(ROOT, 'packages/web-app/dist');
const LOCAL_BUILD = join(ROOT, 'packages/web-app/dist-local/OpenBridge.html');
const TOOLKIT_BUILD = join(ROOT, 'packages/rule-toolkit/dist/OpenBridge-Rule-Toolkit.html');

// Semantic Versioning 2.0.0, without a leading "v".
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function parseVersion(argv: string[]): string {
  const flag = argv.indexOf('--version');
  const raw =
    flag >= 0 ? argv[flag + 1] : readJson<{ version: string }>(join(ROOT, 'package.json')).version;
  const version = (raw ?? '').replace(/^v/, '');
  if (!SEMVER.test(version)) {
    throw new Error(`"${raw ?? ''}" is not a semantic version like 1.2.3`);
  }
  return version;
}

function requireFile(path: string, hint: string): void {
  if (!existsSync(path)) throw new Error(`Missing ${path}. ${hint}`);
}

interface StateInfo {
  code: string;
  verificationStatus: string;
  lastVerified: string;
}

/** Version and data provenance, so anyone running a copy can tell what rules it carries. */
function buildInfo(version: string): Record<string, unknown> {
  const statesDir = join(ROOT, 'data/states');
  const states: StateInfo[] = readdirSync(statesDir).map((code) => {
    const a = readJson<StateInfo & { stateCode: string }>(join(statesDir, code, 'adapter.json'));
    return {
      code: a.stateCode,
      verificationStatus: a.verificationStatus,
      lastVerified: a.lastVerified,
    };
  });
  const fpl = readJson<{ year: number }>(
    join(ROOT, 'data/federal/poverty-guidelines.contiguous.json'),
  );
  return {
    name: 'OpenBridge',
    version,
    dataVersion: String(fpl.year),
    states,
    commit: process.env.GITHUB_SHA ?? 'local-build',
    builtAt: new Date().toISOString(),
    license: 'AGPL-3.0-only',
    notice:
      'Prototype. Eligibility rules are drafts pending expert review. Results are estimates, ' +
      'not decisions.',
  };
}

function stageHosted(name: string, info: Record<string, unknown>): void {
  const dir = join(STAGING, name);
  mkdirSync(dir, { recursive: true });
  cpSync(HOSTED_BUILD, join(dir, 'site'), { recursive: true });
  const hostedFiles = [
    'README.md',
    'serve.mjs',
    'nginx.conf',
    'Caddyfile',
    'Dockerfile',
    'compose.yaml',
    'docker',
  ];
  for (const file of hostedFiles) {
    cpSync(join(ROOT, 'packaging/hosted', file), join(dir, file), { recursive: true });
  }
  cpSync(join(ROOT, 'LICENSE'), join(dir, 'LICENSE'));
  writeFileSync(join(dir, 'BUILD-INFO.json'), `${JSON.stringify(info, null, 2)}\n`);
}

function stageLocal(name: string, info: Record<string, unknown>): void {
  const dir = join(STAGING, name);
  mkdirSync(dir, { recursive: true });
  cpSync(LOCAL_BUILD, join(dir, 'OpenBridge.html'));
  cpSync(join(ROOT, 'packaging/local/README.txt'), join(dir, 'README.txt'));
  cpSync(join(ROOT, 'LICENSE'), join(dir, 'LICENSE'));
  writeFileSync(join(dir, 'BUILD-INFO.json'), `${JSON.stringify(info, null, 2)}\n`);
}

function stageToolkit(name: string, info: Record<string, unknown>): void {
  const dir = join(STAGING, name);
  mkdirSync(dir, { recursive: true });
  cpSync(TOOLKIT_BUILD, join(dir, 'OpenBridge-Rule-Toolkit.html'));
  cpSync(join(ROOT, 'packaging/toolkit/README.txt'), join(dir, 'README.txt'));
  cpSync(join(ROOT, 'LICENSE'), join(dir, 'LICENSE'));
  writeFileSync(join(dir, 'BUILD-INFO.json'), `${JSON.stringify(info, null, 2)}\n`);
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function main(): void {
  const version = parseVersion(process.argv.slice(2));
  requireFile(join(HOSTED_BUILD, 'index.html'), 'Run `npm run build` first.');
  requireFile(LOCAL_BUILD, 'Run `npm run build:local -w @openbridge/web-app` first.');
  requireFile(TOOLKIT_BUILD, 'Run `npm run build` first (it builds the rule toolkit).');

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(STAGING, { recursive: true });
  const info = buildInfo(version);

  const hosted = `openbridge-hosted-v${version}`;
  const local = `openbridge-local-v${version}`;
  const toolkit = `openbridge-rule-toolkit-v${version}`;
  stageHosted(hosted, info);
  stageLocal(local, info);
  stageToolkit(toolkit, info);

  // execFileSync passes arguments directly (no shell), so names cannot inject commands.
  execFileSync('tar', ['-czf', join(OUT, `${hosted}.tar.gz`), '-C', STAGING, hosted]);
  execFileSync('zip', ['-rqX', join(OUT, `${local}.zip`), local], { cwd: STAGING });
  execFileSync('zip', ['-rqX', join(OUT, `${toolkit}.zip`), toolkit], { cwd: STAGING });
  rmSync(STAGING, { recursive: true, force: true });

  const artifacts = [`${hosted}.tar.gz`, `${local}.zip`, `${toolkit}.zip`];
  const sums = artifacts.map((f) => `${sha256(join(OUT, f))}  ${f}`).join('\n');
  writeFileSync(join(OUT, 'SHA256SUMS.txt'), `${sums}\n`);

  console.log(`✓ Packaged OpenBridge v${version} in release-artifacts/:`);
  for (const f of [...artifacts, 'SHA256SUMS.txt']) console.log(`  - ${f}`);
}

main();
