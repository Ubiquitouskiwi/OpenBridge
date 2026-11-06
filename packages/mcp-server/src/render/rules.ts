/**
 * Structured + text views of the reference data itself: which states are supported, and a
 * state's rule values with the provenance citation for each (requirement 5.10 transparency).
 */
import type { FederalData, ProvenanceSource, StateAdapter } from '@openbridge/shared';
import type { ReferenceData } from '../data/loader.js';
import type { EnglishRenderer } from './english.js';
import { NO_CITATION } from './screening.js';

const DRAFT_NOTE =
  'DRAFT: these rules have not been checked by an expert yet and may not be accurate.';

export interface StateSummary {
  code: string;
  name: string;
  programs: string[];
  verificationStatus: StateAdapter['verificationStatus'];
  lastVerified: string;
}

export interface SupportedStates {
  states: StateSummary[];
  dataVersion: string;
  fplYear: number;
  fplEffectiveDate: string;
  snapEffectiveDate: string;
}

export function supportedStateCodes(data: ReferenceData): string[] {
  return [...data.adapters.keys()].sort();
}

export function listSupportedStates(data: ReferenceData): SupportedStates {
  const fpl = data.federal.fplTables.contiguous;
  const states = supportedStateCodes(data).map((code) => {
    const a = data.adapters.get(code) as StateAdapter;
    return {
      code,
      name: a.stateName,
      programs: Object.keys(a.programs),
      verificationStatus: a.verificationStatus,
      lastVerified: a.lastVerified,
    };
  });
  return {
    states,
    dataVersion: `${fpl.year}`,
    fplYear: fpl.year,
    fplEffectiveDate: fpl.effectiveDate,
    snapEffectiveDate: data.federal.snap.effectiveDate,
  };
}

export function supportedStatesText(en: EnglishRenderer, s: SupportedStates): string {
  const lines = [
    `OpenBridge supports ${s.states.length} states. Federal poverty guidelines: ${s.fplYear} ` +
      `(effective ${s.fplEffectiveDate}). SNAP federal values effective ${s.snapEffectiveDate}.`,
  ];
  for (const st of s.states) {
    const programs = st.programs.map((p) => en.programName(p)).join(', ');
    const status = st.verificationStatus === 'verified' ? 'verified' : 'draft, not yet verified';
    lines.push(
      `- ${st.name} (${st.code}): ${programs}. Rules ${status}; last reviewed ${st.lastVerified}.`,
    );
  }
  return lines.join('\n');
}

export interface ProgramRules {
  programId: string;
  values: Record<string, unknown>;
  /** Citations whose `field` belongs to this program (e.g. `snap.grossIncomeLimitPct`). */
  sources: ProvenanceSource[];
  /** Rule fields with no citation listed yet. */
  uncitedFields: string[];
  applyUrl?: string;
}

export interface StateRules {
  stateCode: string;
  stateName: string;
  verificationStatus: StateAdapter['verificationStatus'];
  isDraft: boolean;
  lastVerified: string;
  lastVerifiedBy: string;
  medicaidExpansion: boolean;
  programs: ProgramRules[];
  federal: { fplTables: FederalData['fplTables']; sources: ProvenanceSource[] };
  notice: string;
}

export function getStateRules(adapter: StateAdapter, federal: FederalData): StateRules {
  const programs = Object.entries(adapter.programs).map(([programId, values]) => {
    const prefix = `${programId}.`;
    const sources = adapter.sources.filter((s) => s.field.startsWith(prefix));
    const cited = new Set(sources.map((s) => s.field));
    const uncitedFields = Object.keys(values ?? {})
      .map((k) => `${prefix}${k}`)
      .filter((f) => !cited.has(f));
    const url = adapter.portalUrls[programId as keyof StateAdapter['portalUrls']];
    return {
      programId,
      values: { ...(values ?? {}) },
      sources,
      uncitedFields,
      ...(url ? { applyUrl: url } : {}),
    };
  });
  const isDraft = adapter.verificationStatus !== 'verified';
  return {
    stateCode: adapter.stateCode,
    stateName: adapter.stateName,
    verificationStatus: adapter.verificationStatus,
    isDraft,
    lastVerified: adapter.lastVerified,
    lastVerifiedBy: adapter.lastVerifiedBy,
    medicaidExpansion: adapter.medicaidExpansion,
    programs,
    federal: { fplTables: federal.fplTables, sources: federal.sources },
    notice: isDraft ? DRAFT_NOTE : 'These rules were checked by an expert.',
  };
}

function sourceLine(s: ProvenanceSource): string {
  const note = s.note ? ` Note: ${s.note}` : '';
  return `${s.field}: ${s.sourceName}, ${s.url}, published ${s.publishedDate}.${note}`;
}

export function stateRulesText(en: EnglishRenderer, r: StateRules): string {
  const lines = [
    `# ${r.stateName} (${r.stateCode}) rules`,
    r.notice,
    `Last reviewed ${r.lastVerified} by ${r.lastVerifiedBy}. Medicaid expansion: ` +
      `${r.medicaidExpansion ? 'yes' : 'no'}.`,
  ];
  for (const p of r.programs) {
    lines.push('', `## ${en.programName(p.programId)}`, `Values: ${JSON.stringify(p.values)}`);
    lines.push(...p.sources.map((s) => `- Source for ${sourceLine(s)}`));
    for (const f of p.uncitedFields) lines.push(`- ${f}: ${NO_CITATION}`);
    if (p.applyUrl) lines.push(`Apply: ${p.applyUrl}`);
  }
  lines.push('', '## Federal reference data');
  lines.push(...r.federal.sources.map((s) => `- Source for ${sourceLine(s)}`));
  lines.push('', 'Percent values are a share of the federal poverty line. Money is in cents.');
  return lines.join('\n');
}
