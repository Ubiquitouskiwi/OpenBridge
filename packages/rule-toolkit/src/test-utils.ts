/**
 * Test helpers: the real i18n instance as a plain translate function, and the bundled
 * Ohio adapter, so tests check the words people actually see.
 */
import type { StateAdapter } from '@openbridge/shared';
import { loadAdapter } from './data/index.js';
import i18n from './i18n/config.js';
import type { Translate } from './lib/format.js';

export const t: Translate = (key, options) => String(i18n.t(key, options));

export function ohio(): StateAdapter {
  const adapter = loadAdapter('OH');
  if (!adapter) throw new Error('Ohio adapter missing from the bundle');
  return adapter;
}
