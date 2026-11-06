/**
 * English rendering of engine codes, using the web app's English locale files so the AI
 * sees the same plain-language wording a person sees in the app (requirement 5.9). Mirrors
 * `web-app/src/i18n/renderReason.ts`: i18next-style `{{param}}` interpolation, money params
 * in integer cents rendered as USD, and a humanized key so a raw code is never shown.
 */
import type { CalculationStep, ReasonCode } from '@openbridge/shared';
import type { LocaleBundle, LocaleNamespace } from '../data/loader.js';
import type { LocaleTree } from '../data/schemas.js';

/** Param names that hold integer cents (same set as the web app's renderReason). */
const MONEY_PARAMS = new Set(['income', 'limit', 'amount']);

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Format integer cents as US dollars, e.g. 123456 -> "$1,234.56". */
export function formatCents(cents: number): string {
  return USD.format(cents / 100);
}

/** Format the engine's plain dollar strings (e.g. "1234.50") as US dollars. */
export function formatDollarString(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? USD.format(n) : value;
}

export function humanize(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function lookup(tree: LocaleTree, path: string): string | undefined {
  let node: string | LocaleTree | undefined = tree;
  for (const part of path.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{\s*-?\s*([\w.]+)\s*\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export class EnglishRenderer {
  constructor(private readonly bundle: LocaleBundle) {}

  /** Translate `ns:key`, falling back to a humanized key when the string is missing. */
  t(ns: LocaleNamespace, key: string, params: Record<string, string | number> = {}): string {
    const template = lookup(this.bundle[ns], key);
    const fallbackKey = key.split('.').pop() ?? key;
    return template === undefined ? humanize(fallbackKey) : interpolate(template, params);
  }

  reason(reason: ReasonCode): string {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(reason.params)) {
      params[k] = typeof v === 'number' && MONEY_PARAMS.has(k) ? formatCents(v) : v;
    }
    return this.t('reasons', reason.code, params);
  }

  factorLabel(labelCode: string): string {
    return this.t('factors', labelCode);
  }

  step(code: string): string {
    return this.t('steps', code);
  }

  stepLabel(step: CalculationStep): string {
    return this.t('math', step.labelCode);
  }

  programName(programId: string): string {
    return this.t('common', `programs.${programId}`);
  }

  outcome(outcome: string): string {
    return this.t('common', `outcome.${outcome}`);
  }
}

/** Format a calculation-step value by its unit. */
export function formatStepValue(step: CalculationStep): string {
  if (step.unit === 'cents') return formatCents(step.value);
  if (step.unit === 'pct') return `${Math.round(step.value * 10) / 10}%`;
  return String(step.value);
}
