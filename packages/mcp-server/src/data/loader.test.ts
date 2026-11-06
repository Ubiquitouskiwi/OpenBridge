import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { federal, testAdapter } from '../testsupport/fixtures.js';
import {
  LOCALE_NAMESPACES,
  loadAssets,
  loadFederalData,
  loadLocaleBundle,
  loadStateAdapters,
  resolveDataDir,
  resolveLocaleDir,
} from './loader.js';

const dirs: string[] = [];

function writeDataDir(adapter: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'obmcp-data-'));
  dirs.push(dir);
  mkdirSync(join(dir, 'federal'));
  for (const region of ['contiguous', 'alaska', 'hawaii'] as const) {
    writeFileSync(
      join(dir, 'federal', `poverty-guidelines.${region}.json`),
      JSON.stringify(federal.fplTables[region]),
    );
  }
  writeFileSync(join(dir, 'federal', 'snap.json'), JSON.stringify(federal.snap));
  writeFileSync(join(dir, 'federal', 'sources.json'), JSON.stringify(federal.sources));
  mkdirSync(join(dir, 'states', 'oh'), { recursive: true });
  writeFileSync(join(dir, 'states', 'oh', 'adapter.json'), JSON.stringify(adapter));
  return dir;
}

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('data loading', () => {
  it('loads and validates the repo reference data and English locale', () => {
    const assets = loadAssets({});
    expect([...assets.data.adapters.keys()].sort()).toEqual(['OH', 'TX', 'WA']);
    expect(assets.data.federal.fplTables.contiguous.region).toBe('contiguous');
    for (const ns of LOCALE_NAMESPACES) expect(assets.locale[ns]).toBeTypeOf('object');
  });

  it('honors OPENBRIDGE_DATA_DIR and OPENBRIDGE_LOCALE_DIR', () => {
    expect(resolveDataDir({ OPENBRIDGE_DATA_DIR: '/x/data' })).toBe('/x/data');
    expect(resolveLocaleDir({ OPENBRIDGE_LOCALE_DIR: '/x/en' })).toBe('/x/en');
  });

  it('loads a synthetic data directory', () => {
    const dir = writeDataDir(testAdapter);
    expect(loadFederalData(dir).snap.elderlyAge).toBe(60);
    expect(loadStateAdapters(dir).get('OH')?.stateName).toBe('Testland');
  });

  it('rejects an invalid adapter and names the file', () => {
    const dir = writeDataDir({ ...testAdapter, verificationStatus: 'approved' });
    expect(() => loadStateAdapters(dir)).toThrow(/adapter\.json/);
  });

  it('rejects a locale file with non-string leaves', () => {
    const dir = mkdtempSync(join(tmpdir(), 'obmcp-locale-'));
    dirs.push(dir);
    for (const ns of LOCALE_NAMESPACES) writeFileSync(join(dir, `${ns}.json`), '{"A":"a"}');
    writeFileSync(join(dir, 'reasons.json'), '{"A": 5}');
    expect(() => loadLocaleBundle(dir)).toThrow(/reasons\.json/);
  });
});
