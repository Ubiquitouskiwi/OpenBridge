/**
 * Builds localized DocumentModels (summary sheet, Ohio application, companion guide) from
 * the profile and results (requirements 5.3, Q11/Q43). Localization happens here (in the UI
 * layer); the form-assembly package only renders the resulting model to PDF.
 */
import type { i18n as I18n } from 'i18next';
import type { DocumentModel } from '@openbridge/form-assembly';
import type { EligibilityResult, HouseholdProfile, ProgramId } from '@openbridge/shared';
import { renderReason, renderStep } from '../../i18n/renderReason.js';

function money(i18n: I18n, cents: number): string {
  return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  );
}

/** 10.1 — a generic, printable summary of everything entered plus outcomes and next steps. */
export function buildSummaryModel(
  profile: HouseholdProfile,
  result: EligibilityResult,
  i18n: I18n,
): DocumentModel {
  const t = i18n.t.bind(i18n);
  return {
    title: t('appName') + ' — ' + t('results'),
    subtitle: `${t('not_legal_advice')}`,
    sections: [
      {
        heading: 'Household',
        rows: [
          { label: 'State', value: profile.stateCode },
          { label: 'County', value: profile.county || '—' },
          { label: 'People in household', value: String(profile.members.length) },
          { label: 'Monthly income', value: money(i18n, profile.grossMonthlyIncomeCents) },
        ],
      },
      ...result.results.map((r) => ({
        heading: t(`programs.${r.programId}`),
        rows: [{ label: 'Result', value: t(`outcome.${r.outcome}`) }],
        notes: [
          ...r.reasons.map((reason) => renderReason(i18n, reason)),
          ...r.nextStepCodes.map((code) => renderStep(i18n, code)),
        ],
      })),
    ],
    footer: `Generated ${result.evaluationDate}. Data version ${result.dataVersion}.`,
  };
}

/** 10.2 — Ohio Benefits pre-filled application, built from a data-driven field mapping. */
export function buildOhioModel(
  profile: HouseholdProfile,
  programId: ProgramId,
  i18n: I18n,
): DocumentModel {
  const t = i18n.t.bind(i18n);
  const fields: { label: string; value: string }[] = [
    { label: 'Program', value: t(`programs.${programId}`) },
    { label: 'State', value: 'Ohio' },
    { label: 'County', value: profile.county || '—' },
    { label: 'Household size', value: String(profile.members.length) },
    { label: 'Total monthly income', value: money(i18n, profile.grossMonthlyIncomeCents) },
    { label: 'Monthly rent/mortgage', value: money(i18n, profile.monthlyHousingCostCents ?? 0) },
    { label: 'Monthly utilities', value: money(i18n, profile.monthlyUtilityCostCents ?? 0) },
  ];
  const memberRows = profile.members.map((m, i) => ({
    label: `Member ${i + 1}`,
    value: `${m.relationship}, age ${m.age ?? '—'}${m.isPregnant ? ', pregnant' : ''}${
      m.isDisabled ? ', disability' : ''
    }`,
  }));
  return {
    title: 'Ohio Benefits application (pre-filled)',
    subtitle: 'Review this against the official form at benefits.ohio.gov before submitting.',
    sections: [
      { heading: 'Application fields', rows: fields },
      { heading: 'Household members', rows: memberRows },
    ],
    footer: t('not_legal_advice'),
  };
}

/** 10.3 — a localized companion guide for the (English) official application. */
export function buildGuideModel(programId: ProgramId, i18n: I18n): DocumentModel {
  const t = i18n.t.bind(i18n);
  return {
    title: `${t(`programs.${programId}`)} — how to apply`,
    subtitle: 'The official application is in English. This guide explains each step.',
    sections: [
      {
        heading: t('next_steps'),
        notes: [
          renderStep(i18n, 'STEP_REVIEW_AND_APPLY'),
          renderStep(i18n, 'DOC_IDENTITY'),
          renderStep(i18n, 'DOC_INCOME_PROOF'),
          renderStep(i18n, 'DOC_RESIDENCY'),
        ],
      },
    ],
    footer: t('not_legal_advice'),
  };
}
