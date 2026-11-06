/**
 * Builds the Markdown review report a reviewer downloads or copies (Review a state's rules).
 * Pure: the date, versions, and translate function are passed in.
 */
import { readRuleValue, ruleFieldsFor } from '@openbridge/shared';
import type { RuleField, StateAdapter } from '@openbridge/shared';
import { citationForField } from '../../lib/citations.js';
import {
  type Translate,
  fieldLabel,
  formatIsoDate,
  formatRuleValue,
  markdownCell,
} from '../../lib/format.js';

export type ReviewStatus = 'matches' | 'mismatch' | 'unsure';

export const REVIEW_STATUSES: readonly ReviewStatus[] = ['matches', 'mismatch', 'unsure'];

export interface ReviewEntry {
  status?: ReviewStatus;
  note: string;
}

/** Review choices keyed by rule field path. */
export type ReviewEntries = Record<string, ReviewEntry | undefined>;

export interface Reviewer {
  name: string;
  role: string;
}

export interface ReviewReportInput {
  t: Translate;
  locale: string;
  adapter: StateAdapter;
  entries: ReviewEntries;
  reviewer: Reviewer;
  /** The report date, YYYY-MM-DD. */
  date: string;
  toolkitVersion: string;
  dataVersion: string;
}

export interface ReviewCounts {
  matches: number;
  mismatch: number;
  unsure: number;
  unchecked: number;
  total: number;
}

export function countReview(fields: readonly RuleField[], entries: ReviewEntries): ReviewCounts {
  const counts: ReviewCounts = { matches: 0, mismatch: 0, unsure: 0, unchecked: 0, total: 0 };
  for (const field of fields) {
    counts.total += 1;
    const status = entries[field.path]?.status;
    if (status) counts[status] += 1;
    else counts.unchecked += 1;
  }
  return counts;
}

function sourceText(input: ReviewReportInput, field: RuleField): string {
  const citation = citationForField(input.adapter, field);
  if (!citation) return input.t('review.noSource');
  return input.t('report.sourceCell', {
    name: citation.sourceName,
    date: formatIsoDate(input.locale, citation.publishedDate),
    url: citation.url,
  });
}

function headerLines(input: ReviewReportInput): string[] {
  const { t, adapter, reviewer } = input;
  const lines = [
    `# ${t('report.title', { state: adapter.stateName })}`,
    '',
    `- ${t('report.date', { date: input.date })}`,
  ];
  const name = reviewer.name.trim();
  const role = reviewer.role.trim();
  if (name) lines.push(`- ${t('report.reviewerName', { name })}`);
  if (role) lines.push(`- ${t('report.reviewerRole', { role })}`);
  lines.push(
    `- ${t('report.verificationStatus', { status: adapter.verificationStatus })}`,
    `- ${t('report.lastVerified', { date: adapter.lastVerified })}`,
    `- ${t('report.toolkitVersion', { version: input.toolkitVersion })}`,
    `- ${t('report.dataVersion', { version: input.dataVersion })}`,
  );
  return lines;
}

function tableLines(input: ReviewReportInput, fields: readonly RuleField[]): string[] {
  const { t, locale, adapter, entries } = input;
  const lines = [
    `| ${[
      t('report.colProgram'),
      t('report.colRule'),
      t('report.colValue'),
      t('report.colCheck'),
      t('report.colSource'),
      t('report.colNotes'),
    ].join(' | ')} |`,
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const field of fields) {
    const entry = entries[field.path];
    const cells = [
      t(`app:programs.${field.program}`),
      fieldLabel(t, adapter, field),
      formatRuleValue(t, locale, field, readRuleValue(adapter, field.path)),
      entry?.status ? t(`review.status.${entry.status}`) : t('review.status.unchecked'),
      sourceText(input, field),
      entry?.note ?? '',
    ];
    lines.push(`| ${cells.map(markdownCell).join(' | ')} |`);
  }
  return lines;
}

export function buildReviewReport(input: ReviewReportInput): string {
  const { t } = input;
  const fields = ruleFieldsFor(input.adapter);
  const counts = countReview(fields, input.entries);
  const lines = [
    ...headerLines(input),
    '',
    `## ${t('report.summaryHeading')}`,
    '',
    `- ${t('report.countMatches', { count: counts.matches })}`,
    `- ${t('report.countMismatch', { count: counts.mismatch })}`,
    `- ${t('report.countUnsure', { count: counts.unsure })}`,
    `- ${t('report.countUnchecked', { count: counts.unchecked })}`,
    '',
    `## ${t('report.valuesHeading')}`,
    '',
    ...tableLines(input, fields),
    '',
    t('report.footer'),
    '',
  ];
  return lines.join('\n');
}

/** File name for the report, for example `openbridge-review-oh-2026-11-06.md`. */
export function reviewReportFileName(stateCode: string, date: string): string {
  return `openbridge-review-${stateCode.toLowerCase()}-${date}.md`;
}
