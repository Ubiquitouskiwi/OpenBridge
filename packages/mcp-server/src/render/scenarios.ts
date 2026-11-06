/**
 * Plain-English summaries for the income "what if" tool: scenario rows and benefit cliffs
 * (per program and per member), from the engine's evaluateIncomeScenarios/findIncomeCliffs.
 */
import type { IncomeCliff, IncomeScenario } from '@openbridge/eligibility-engine';
import { DISCLAIMER } from '../copy.js';
import { type EnglishRenderer, formatCents } from './english.js';

export interface RenderedCliff extends IncomeCliff {
  programName: string;
  summary: string;
}

export interface RenderedScenario extends IncomeScenario {
  summary: string;
}

export interface RenderedIncomeChange {
  stateCode: string;
  evaluationDate: string;
  scan: { maxIncreaseCents: number; stepCents: number };
  scenarios: RenderedScenario[];
  cliffs: RenderedCliff[];
  disclaimer: string;
}

function changeText(deltaCents: number): string {
  if (deltaCents === 0) return 'With no change in income';
  const dir = deltaCents > 0 ? 'more' : 'less';
  return `With ${formatCents(Math.abs(deltaCents))} ${dir} per month`;
}

export function summarizeScenario(en: EnglishRenderer, s: IncomeScenario): string {
  const parts = s.programs.map((p) => {
    const benefit =
      p.estimatedBenefitCents !== undefined
        ? `, about ${formatCents(p.estimatedBenefitCents)} a month`
        : '';
    const members = (p.memberOutcomes ?? [])
      .map((m) => `"${m.memberId}": ${en.outcome(m.outcome)}`)
      .join('; ');
    const who = members ? ` (by person: ${members})` : '';
    return `${en.programName(p.programId)}: ${en.outcome(p.outcome)}${benefit}${who}`;
  });
  return (
    `${changeText(s.deltaMonthlyCents)} (total ${formatCents(s.grossMonthlyIncomeCents)} ` +
    `a month): ${parts.join('. ')}.`
  );
}

export function summarizeCliff(en: EnglishRenderer, c: IncomeCliff, scanMaxCents: number): string {
  const subject = c.memberId
    ? `${en.programName(c.programId)} for person "${c.memberId}"`
    : en.programName(c.programId);
  const start = `${subject} is "${en.outcome(c.baselineOutcome)}" now.`;
  if (c.uncertainAtDeltaCents === undefined && c.lostAtDeltaCents === undefined) {
    return `${start} We found no change up to ${formatCents(scanMaxCents)} more per month.`;
  }
  const parts = [start];
  if (c.uncertainAtDeltaCents !== undefined && c.uncertainAtDeltaCents !== c.lostAtDeltaCents) {
    parts.push(
      `At about ${formatCents(c.uncertainAtDeltaCents)} more per month, it becomes less sure.`,
    );
  }
  if (c.lostAtDeltaCents !== undefined) {
    parts.push(
      `At about ${formatCents(c.lostAtDeltaCents)} more per month, it may stop. ` +
        'Check with the agency before deciding, and ask about any transition help.',
    );
  }
  return parts.join(' ');
}

export function incomeChangeText(r: RenderedIncomeChange): string {
  const lines = [
    `# OpenBridge income-change estimate for ${r.stateCode} as of ${r.evaluationDate}`,
    '',
    '## Scenarios',
    ...r.scenarios.map((s) => `- ${s.summary}`),
    '',
    `## Benefit cliffs (scanned up to ${formatCents(r.scan.maxIncreaseCents)} more per month, ` +
      `in ${formatCents(r.scan.stepCents)} steps)`,
    ...(r.cliffs.length > 0
      ? r.cliffs.map((c) => `- ${c.summary}`)
      : ['- No program looks likely right now, so there is no cliff to show.']),
    '',
    'These are rough estimates checked at fixed steps, so the real cut-off may be a bit different.',
    '',
    `IMPORTANT: ${r.disclaimer}`,
  ];
  return lines.join('\n');
}

export function renderIncomeChange(
  en: EnglishRenderer,
  input: {
    stateCode: string;
    evaluationDate: string;
    scan: { maxIncreaseCents: number; stepCents: number };
    scenarios: IncomeScenario[];
    cliffs: IncomeCliff[];
  },
): RenderedIncomeChange {
  return {
    stateCode: input.stateCode,
    evaluationDate: input.evaluationDate,
    scan: input.scan,
    scenarios: input.scenarios.map((s) => ({ ...s, summary: summarizeScenario(en, s) })),
    cliffs: input.cliffs.map((c) => ({
      ...c,
      programName: en.programName(c.programId),
      summary: summarizeCliff(en, c, input.scan.maxIncreaseCents),
    })),
    disclaimer: DISCLAIMER,
  };
}
