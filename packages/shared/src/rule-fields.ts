/**
 * Catalog of the state-adapter rule values that people can review and propose changes to
 * (the community rule toolkit and `npm run rules:apply`). Keys and units only, like reason
 * codes: plain-language labels live in the toolkit's locale files.
 */
import type { StateAdapter } from './types.js';

/** How a rule value is stored: a % of the poverty line, integer cents, or yes/no. */
export type RuleFieldUnit = 'pct' | 'cents' | 'boolean';

export type RuleValue = number | boolean | null;

export interface RuleField {
  /** Dotted path inside the adapter, e.g. `snap.grossIncomeLimitPct` or `medicaid.childTiers.0.limitPct`. */
  path: string;
  /** Program the value belongs to (the adapter's `programs` key). */
  program: keyof StateAdapter['programs'];
  unit: RuleFieldUnit;
  /** `null` is allowed (for example a limit waived under broad-based categorical eligibility). */
  nullable: boolean;
  /** The `sources[].field` that should cite this value. */
  sourceField: string;
  /** Stable label key for the toolkit locale (`fields.<labelKey>`). */
  labelKey: string;
}

const STATIC_FIELDS: readonly RuleField[] = [
  f('snap', 'bbce', 'boolean'),
  f('snap', 'grossIncomeLimitPct', 'pct'),
  f('snap', 'netIncomeLimitPct', 'pct', true),
  f('snap', 'assetLimitCents', 'cents', true),
  f('snap', 'assetLimitElderlyDisabledCents', 'cents', true),
  f('snap', 'hasVehicleAssetTest', 'boolean'),
  f('medicaid', 'expansion', 'boolean'),
  f('medicaid', 'adultLimitPct', 'pct'),
  f('medicaid', 'parentCaretakerLimitPct', 'pct'),
  f('medicaid', 'pregnantLimitPct', 'pct'),
  f('wic', 'incomeLimitPct', 'pct'),
  f('liheap', 'incomeLimitPct', 'pct'),
  f('liheap', 'categoricalIfSnap', 'boolean'),
  f('tanf', 'baseMonthlyLimitCents', 'cents'),
  f('tanf', 'perAdditionalPersonCents', 'cents'),
];

function f(
  program: RuleField['program'],
  key: string,
  unit: RuleFieldUnit,
  nullable = false,
): RuleField {
  return {
    path: `${program}.${key}`,
    program,
    unit,
    nullable,
    sourceField: `${program}.${key}`,
    labelKey: `${program}.${key}`,
  };
}

/**
 * Every reviewable rule field in this adapter, in display order. Medicaid child tiers are
 * expanded per tier (`medicaid.childTiers.<i>.limitPct`), all cited by `medicaid.childTiers`.
 * Programs the adapter does not configure are left out.
 */
export function ruleFieldsFor(adapter: StateAdapter): RuleField[] {
  const fields: RuleField[] = [];
  for (const field of STATIC_FIELDS) {
    if (adapter.programs[field.program] === undefined) continue;
    fields.push(field);
    if (field.path === 'medicaid.pregnantLimitPct') {
      const tiers = adapter.programs.medicaid?.childTiers ?? [];
      tiers.forEach((_tier, i) => {
        fields.push({
          path: `medicaid.childTiers.${i}.limitPct`,
          program: 'medicaid',
          unit: 'pct',
          nullable: false,
          sourceField: 'medicaid.childTiers',
          labelKey: 'medicaid.childTierLimitPct',
        });
      });
    }
  }
  return fields;
}

/** Look up a field by path for this adapter, or undefined if it is not a reviewable field. */
export function findRuleField(adapter: StateAdapter, path: string): RuleField | undefined {
  return ruleFieldsFor(adapter).find((field) => field.path === path);
}

/** Read a value by dotted path (numeric segments index arrays). */
export function readRuleValue(adapter: StateAdapter, path: string): RuleValue | undefined {
  let node: unknown = adapter.programs;
  for (const segment of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  if (node === null || typeof node === 'number' || typeof node === 'boolean') return node;
  return undefined;
}

/** Whether a value has the right type for the field. Cents must be whole, non-negative numbers. */
export function isValidRuleValue(field: RuleField, value: RuleValue): boolean {
  if (value === null) return field.nullable;
  if (field.unit === 'boolean') return typeof value === 'boolean';
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return false;
  return field.unit === 'cents' ? Number.isInteger(value) : true;
}
