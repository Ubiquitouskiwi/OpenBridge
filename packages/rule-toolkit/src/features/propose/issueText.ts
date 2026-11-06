/**
 * Markdown for the "Eligibility rule correction" GitHub issue (or an email), describing a
 * proposal in natural units. Pure.
 */
import { findRuleField } from '@openbridge/shared';
import type { RuleProposal, StateAdapter } from '@openbridge/shared';
import { type Translate, fieldLabel, formatIsoDate, formatRuleValue } from '../../lib/format.js';

export function buildIssueText(
  t: Translate,
  locale: string,
  adapter: StateAdapter,
  proposal: RuleProposal,
  fileName: string,
): string {
  const lines = [
    `## ${t('issue.title', { state: adapter.stateName })}`,
    '',
    `### ${t('issue.changesHeading')}`,
    '',
  ];
  for (const change of proposal.changes) {
    const field = findRuleField(adapter, change.field);
    if (!field) continue;
    lines.push(
      `- ${t('issue.changeLine', {
        program: t(`app:programs.${field.program}`),
        rule: fieldLabel(t, adapter, field),
        from: formatRuleValue(t, locale, field, change.currentValue),
        to: formatRuleValue(t, locale, field, change.proposedValue),
        path: change.field,
      })}`,
    );
  }
  lines.push(
    '',
    `### ${t('issue.sourceHeading')}`,
    '',
    `- ${t('issue.sourceName', { name: proposal.source.sourceName })}`,
    `- ${t('issue.sourceUrl', { url: proposal.source.url })}`,
    `- ${t('issue.sourceDate', {
      date: formatIsoDate(locale, proposal.source.publishedDate),
    })}`,
    '',
    `### ${t('issue.whyHeading')}`,
    '',
    proposal.explanation,
    '',
    `### ${t('issue.fileHeading')}`,
    '',
    t('issue.fileLine', { file: fileName, version: proposal.createdWith ?? '' }),
    '',
  );
  return lines.join('\n');
}
