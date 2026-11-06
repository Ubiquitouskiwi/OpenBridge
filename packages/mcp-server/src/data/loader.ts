/**
 * Loads the public reference data (federal tables + state adapters) and the English locale
 * files from disk once, at startup. The built package carries its own copies under
 * `dist/assets/` (see scripts/copy-assets.mjs); from source, the repo's `data/` and the web
 * app's English locale are used. Either can be overridden with OPENBRIDGE_DATA_DIR and
 * OPENBRIDGE_LOCALE_DIR. Every file is validated with Zod before use.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FederalData, StateAdapter } from '@openbridge/shared';
import {
  type LocaleTree,
  fplTableSchema,
  localeTreeSchema,
  provenanceList,
  snapFederalSchema,
  stateAdapterSchema,
} from './schemas.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** `dist/assets/...` when running the build; absent when running from `src/`. */
const BUNDLED_ASSETS_DIR = resolve(HERE, '../assets');
/** Repo root, two levels above this package (`packages/mcp-server`). */
const REPO_ROOT = resolve(HERE, '../../../..');

/** The locale namespaces this server renders from. */
export const LOCALE_NAMESPACES = ['reasons', 'factors', 'steps', 'math', 'common'] as const;
export type LocaleNamespace = (typeof LOCALE_NAMESPACES)[number];
export type LocaleBundle = Record<LocaleNamespace, LocaleTree>;

export interface ReferenceData {
  federal: FederalData;
  /** Keyed by upper-case state code. */
  adapters: ReadonlyMap<string, StateAdapter>;
}

export interface LoadedAssets {
  data: ReferenceData;
  locale: LocaleBundle;
}

export type EnvLike = Record<string, string | undefined>;

export function resolveDataDir(env: EnvLike = process.env): string {
  if (env.OPENBRIDGE_DATA_DIR) return resolve(env.OPENBRIDGE_DATA_DIR);
  const bundled = resolve(BUNDLED_ASSETS_DIR, 'data');
  return existsSync(bundled) ? bundled : resolve(REPO_ROOT, 'data');
}

export function resolveLocaleDir(env: EnvLike = process.env): string {
  if (env.OPENBRIDGE_LOCALE_DIR) return resolve(env.OPENBRIDGE_LOCALE_DIR);
  const bundled = resolve(BUNDLED_ASSETS_DIR, 'locales/en');
  return existsSync(bundled) ? bundled : resolve(REPO_ROOT, 'packages/web-app/src/i18n/locales/en');
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Parse a file with a schema, naming the file (never its contents) on failure. */
function parseFile<T>(path: string, schema: { parse: (v: unknown) => T }): T {
  try {
    return schema.parse(readJson(path));
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    throw new Error(`OpenBridge reference file failed validation: ${path}\n${why}`, { cause: err });
  }
}

export function loadFederalData(dataDir: string): FederalData {
  const fed = resolve(dataDir, 'federal');
  const table = (name: string) =>
    parseFile(resolve(fed, `poverty-guidelines.${name}.json`), fplTableSchema);
  return {
    fplTables: {
      contiguous: table('contiguous'),
      alaska: table('alaska'),
      hawaii: table('hawaii'),
    },
    snap: parseFile(resolve(fed, 'snap.json'), snapFederalSchema),
    sources: parseFile(resolve(fed, 'sources.json'), provenanceList),
  };
}

export function loadStateAdapters(dataDir: string): Map<string, StateAdapter> {
  const statesDir = resolve(dataDir, 'states');
  const adapters = new Map<string, StateAdapter>();
  const dirs = readdirSync(statesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const dir of dirs) {
    const path = resolve(statesDir, dir.name, 'adapter.json');
    if (!existsSync(path)) continue;
    const adapter: StateAdapter = parseFile(path, stateAdapterSchema);
    adapters.set(adapter.stateCode.toUpperCase(), adapter);
  }
  if (adapters.size === 0) throw new Error(`No state adapters found under ${statesDir}`);
  return adapters;
}

export function loadLocaleBundle(localeDir: string): LocaleBundle {
  const entries = LOCALE_NAMESPACES.map(
    (ns) => [ns, parseFile(resolve(localeDir, `${ns}.json`), localeTreeSchema)] as const,
  );
  return Object.fromEntries(entries) as LocaleBundle;
}

/** Load and validate everything the server needs. Throws (at startup) on bad files. */
export function loadAssets(env: EnvLike = process.env): LoadedAssets {
  const dataDir = resolveDataDir(env);
  return {
    data: { federal: loadFederalData(dataDir), adapters: loadStateAdapters(dataDir) },
    locale: loadLocaleBundle(resolveLocaleDir(env)),
  };
}
