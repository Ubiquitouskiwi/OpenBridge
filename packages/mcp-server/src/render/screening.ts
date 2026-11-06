/**
 * Turns an engine EligibilityResult into (a) structured content for the agent and (b) a
 * plain-English text rendering: outcome, reasons, factors, the "show the math" steps with
 * their citations, per-member results, next steps, and the disclaimer (requirement 5.9).
 */
import type {
  CalculationStep,
  EligibilityResult,
  FactorRow,
  FederalData,
  MemberEligibility,
  ProgramEligibilityResult,
  ProvenanceSource,
  ReasonCode,
  StateAdapter,
} from '@openbridge/shared';
import { DISCLAIMER } from '../copy.js';
import {
  type EnglishRenderer,
  formatCents,
  formatDollarString,
  formatStepValue,
} from './english.js';

export const NO_CITATION = 'no citation listed yet';

export interface Citation {
  sourceName: string;
  url: string;
  publishedDate: string;
  note?: string;
}

export interface RenderedStep extends CalculationStep {
  label: string;
  formattedValue: string;
  /** The cited source, `null` when the value should cite one but none is listed yet. */
  citation?: Citation | null;
}

interface RenderedDetail {
  reasons: (ReasonCode & { text: string })[];
  factors: (FactorRow & { label: string; formattedValue: string; formattedThreshold: string })[];
  calculation: RenderedStep[];
}

export interface RenderedMember extends RenderedDetail {
  memberId: string;
  outcome: string;
  outcomeLabel: string;
  estimatedBenefitCents?: number;
}

export interface RenderedProgram extends RenderedDetail {
  programId: string;
  programName: string;
  scope: string;
  outcome: string;
  outcomeLabel: string;
  estimatedBenefitCents?: number;
  fplCalculation: ProgramEligibilityResult['fplCalculation'];
  memberResults?: RenderedMember[];
  nextSteps: { code: string; text: string }[];
  requiredDocuments: { code: string; text: string }[];
  applyUrl: string;
}

export interface RenderedScreening {
  stateCode: string;
  stateName: string;
  evaluationDate: string;
  dataVersion: string;
  rulesLastUpdated: string;
  rulesVerificationStatus: StateAdapter['verificationStatus'];
  grossMonthlyIncomeCents: number;
  programs: RenderedProgram[];
  disclaimer: string;
}

export interface CitationSources {
  adapter: StateAdapter;
  federal: FederalData;
}

export function resolveCitation(
  step: CalculationStep,
  sources: CitationSources,
): Citation | null | undefined {
  if (!step.source && step.op !== 'rule') return undefined;
  if (!step.source) return null;
  const list: ProvenanceSource[] =
    step.source.scope === 'state' ? sources.adapter.sources : sources.federal.sources;
  const hit = list.find((s) => s.field === step.source?.field);
  if (!hit) return null;
  const { sourceName, url, publishedDate, note } = hit;
  return note ? { sourceName, url, publishedDate, note } : { sourceName, url, publishedDate };
}

function renderDetail(
  en: EnglishRenderer,
  sources: CitationSources,
  r: { reasons: ReasonCode[]; factors: FactorRow[]; calculation?: CalculationStep[] },
): RenderedDetail {
  return {
    reasons: r.reasons.map((reason) => ({ ...reason, text: en.reason(reason) })),
    factors: r.factors.map((f) => ({
      ...f,
      label: en.factorLabel(f.labelCode),
      formattedValue: formatDollarString(f.value),
      formattedThreshold: formatDollarString(f.threshold),
    })),
    calculation: (r.calculation ?? []).map((step) => {
      const citation = resolveCitation(step, sources);
      return {
        ...step,
        label: en.stepLabel(step),
        formattedValue: formatStepValue(step),
        ...(citation !== undefined ? { citation } : {}),
      };
    }),
  };
}

function renderMember(
  en: EnglishRenderer,
  sources: CitationSources,
  m: MemberEligibility,
): RenderedMember {
  return {
    memberId: m.memberId,
    outcome: m.outcome,
    outcomeLabel: en.outcome(m.outcome),
    ...(m.estimatedBenefitCents !== undefined
      ? { estimatedBenefitCents: m.estimatedBenefitCents }
      : {}),
    ...renderDetail(en, sources, m),
  };
}

function renderProgram(
  en: EnglishRenderer,
  sources: CitationSources,
  r: ProgramEligibilityResult,
): RenderedProgram {
  return {
    programId: r.programId,
    programName: en.programName(r.programId),
    scope: r.scope,
    outcome: r.outcome,
    outcomeLabel: en.outcome(r.outcome),
    ...(r.estimatedBenefitCents !== undefined
      ? { estimatedBenefitCents: r.estimatedBenefitCents }
      : {}),
    fplCalculation: r.fplCalculation,
    ...renderDetail(en, sources, r),
    ...(r.memberResults
      ? { memberResults: r.memberResults.map((m) => renderMember(en, sources, m)) }
      : {}),
    nextSteps: r.nextStepCodes.map((code) => ({ code, text: en.step(code) })),
    requiredDocuments: r.requiredDocumentCodes.map((code) => ({ code, text: en.step(code) })),
    applyUrl: r.applyUrl,
  };
}

export function renderScreening(
  en: EnglishRenderer,
  sources: CitationSources,
  result: EligibilityResult,
): RenderedScreening {
  return {
    stateCode: sources.adapter.stateCode,
    stateName: sources.adapter.stateName,
    evaluationDate: result.evaluationDate,
    dataVersion: result.dataVersion,
    rulesLastUpdated: result.rulesLastUpdated,
    rulesVerificationStatus: sources.adapter.verificationStatus,
    grossMonthlyIncomeCents: result.profile.grossMonthlyIncomeCents,
    programs: result.results.map((r) => renderProgram(en, sources, r)),
    disclaimer: DISCLAIMER,
  };
}

/* ---- text ------------------------------------------------------------------------------ */

function citationText(c: Citation | null): string {
  if (c === null) return NO_CITATION;
  return `${c.sourceName}, ${c.url}, published ${c.publishedDate}`;
}

function detailLines(d: RenderedDetail, indent: string): string[] {
  const lines: string[] = [];
  if (d.reasons.length > 0) {
    lines.push(`${indent}Why:`);
    for (const r of d.reasons) lines.push(`${indent}  - ${r.text}`);
  }
  if (d.factors.length > 0) {
    lines.push(`${indent}Checks:`);
    for (const f of d.factors) {
      const verdict = f.passes ? 'within the limit' : 'over the limit';
      lines.push(
        `${indent}  - ${f.label}: ${f.formattedValue} (limit ${f.formattedThreshold}, ${verdict})`,
      );
    }
  }
  if (d.calculation.length > 0) {
    lines.push(`${indent}The math:`);
    for (const s of d.calculation) {
      const cite = s.citation !== undefined ? ` [source: ${citationText(s.citation)}]` : '';
      lines.push(`${indent}  - ${s.label}: ${s.formattedValue}${cite}`);
    }
  }
  return lines;
}

function programLines(p: RenderedProgram): string[] {
  const lines = [`## ${p.programName}: ${p.outcomeLabel} (${p.outcome})`];
  if (p.estimatedBenefitCents !== undefined) {
    lines.push(`Estimated monthly benefit: ${formatCents(p.estimatedBenefitCents)}`);
  }
  lines.push(...detailLines(p, ''));
  for (const m of p.memberResults ?? []) {
    lines.push(`Person "${m.memberId}": ${m.outcomeLabel} (${m.outcome})`);
    lines.push(...detailLines(m, '  '));
  }
  if (p.nextSteps.length > 0) {
    lines.push('Next steps:');
    for (const s of p.nextSteps) lines.push(`  - ${s.text}`);
  }
  if (p.requiredDocuments.length > 0) {
    lines.push(`Documents to have ready: ${p.requiredDocuments.map((d) => d.text).join('; ')}`);
  }
  if (p.applyUrl) lines.push(`Apply: ${p.applyUrl}`);
  return lines;
}

export function screeningText(s: RenderedScreening): string {
  const header = [
    `# OpenBridge estimate for ${s.stateName} (${s.stateCode}) as of ${s.evaluationDate}`,
    `Household income counted: ${formatCents(s.grossMonthlyIncomeCents)} per month.`,
    `Rules data version ${s.dataVersion}, last updated ${s.rulesLastUpdated}.` +
      (s.rulesVerificationStatus === 'verified'
        ? ''
        : ' These state rules are a DRAFT and have not been checked by an expert yet.'),
  ];
  const body = s.programs.flatMap((p) => ['', ...programLines(p)]);
  return [...header, ...body, '', `IMPORTANT: ${s.disclaimer}`].join('\n');
}
