/**
 * Source lookup for rule values and "show the math" steps. Pure.
 */
import type {
  CalculationStep,
  FederalData,
  ProvenanceSource,
  RuleField,
  StateAdapter,
} from '@openbridge/shared';

/** The adapter's citation for a rule field, or undefined when none is listed yet. */
export function citationForField(
  adapter: Pick<StateAdapter, 'sources'>,
  field: Pick<RuleField, 'sourceField'>,
): ProvenanceSource | undefined {
  return adapter.sources.find((s) => s.field === field.sourceField);
}

/** True when `a` and `b` are the same field path, or one is a dotted parent of the other. */
function fieldsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  return longer.startsWith(shorter) && /^[.[]/.test(longer.slice(shorter.length));
}

/** The citation for a calculation step's source. An exact field match wins. */
export function citationForStep(
  source: CalculationStep['source'],
  adapter: Pick<StateAdapter, 'sources'> | undefined,
  federal: Pick<FederalData, 'sources'>,
): ProvenanceSource | undefined {
  if (!source) return undefined;
  const pool = source.scope === 'state' ? (adapter?.sources ?? []) : federal.sources;
  return (
    pool.find((s) => s.field === source.field) ??
    pool.find((s) => fieldsMatch(s.field, source.field))
  );
}
