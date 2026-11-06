import { useId, useMemo, useState } from 'react';
import { ruleFieldsFor } from '@openbridge/shared';
import type { RuleField, StateAdapter } from '@openbridge/shared';
import { ExportActions } from '../../components/ExportActions.js';
import { StatePicker } from '../../components/StatePicker.js';
import { DATA_VERSION, TOOLKIT_VERSION, loadAdapter } from '../../data/index.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { formatIsoDate, isoDateOf } from '../../lib/format.js';
import { ReviewFieldRow } from './ReviewFieldRow.js';
import {
  type ReviewEntries,
  type Reviewer,
  buildReviewReport,
  countReview,
  reviewReportFileName,
} from './reviewReport.js';

/** Fields grouped by program, keeping the catalog's display order. */
function groupByProgram(fields: readonly RuleField[]): [string, RuleField[]][] {
  const groups = new Map<string, RuleField[]>();
  for (const field of fields) {
    const list = groups.get(field.program) ?? [];
    list.push(field);
    groups.set(field.program, list);
  }
  return [...groups.entries()];
}

function ReviewerFields({ value, onChange }: { value: Reviewer; onChange: (r: Reviewer) => void }) {
  const { t } = useTranslate();
  const nameId = useId();
  const roleId = useId();
  return (
    <fieldset className="card">
      <legend>{t('review.reviewerLegend')}</legend>
      <p className="hint">{t('review.reviewerHint')}</p>
      <div className="field">
        <label htmlFor={nameId}>{t('review.reviewerName')}</label>
        <input
          id={nameId}
          value={value.name}
          autoComplete="off"
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={roleId}>{t('review.reviewerRole')}</label>
        <input
          id={roleId}
          value={value.role}
          autoComplete="off"
          onChange={(e) => onChange({ ...value, role: e.target.value })}
        />
      </div>
    </fieldset>
  );
}

function StateReview({ adapter }: { adapter: StateAdapter }) {
  const { t, locale } = useTranslate();
  const [entries, setEntries] = useState<ReviewEntries>({});
  const [reviewer, setReviewer] = useState<Reviewer>({ name: '', role: '' });
  const fields = useMemo(() => ruleFieldsFor(adapter), [adapter]);
  const counts = countReview(fields, entries);
  const checked = counts.total - counts.unchecked;
  const date = isoDateOf(new Date());
  const report = () =>
    buildReviewReport({
      t,
      locale,
      adapter,
      entries,
      reviewer,
      date,
      toolkitVersion: TOOLKIT_VERSION,
      dataVersion: DATA_VERSION,
    });

  return (
    <>
      <p className="note">
        {t('review.stateStatus', {
          status: t(`common.verification.${adapter.verificationStatus}`),
          date: formatIsoDate(locale, adapter.lastVerified),
        })}
      </p>
      <p role="status" className="progress">
        {t('review.progress', { checked, total: counts.total })}
      </p>
      {groupByProgram(fields).map(([program, list]) => (
        <section key={program} aria-labelledby={`review-${program}`}>
          <h2 id={`review-${program}`}>{t(`app:programs.${program}`)}</h2>
          <ul className="plain-list">
            {list.map((field) => (
              <ReviewFieldRow
                key={field.path}
                adapter={adapter}
                field={field}
                entry={entries[field.path]}
                onChange={(entry) => setEntries((prev) => ({ ...prev, [field.path]: entry }))}
              />
            ))}
          </ul>
        </section>
      ))}
      <section aria-labelledby="review-finish">
        <h2 id="review-finish">{t('review.finishHeading')}</h2>
        <ReviewerFields value={reviewer} onChange={setReviewer} />
        <p>{t('review.finishHelp')}</p>
        <ExportActions
          fileName={reviewReportFileName(adapter.stateCode, date)}
          mimeType="text/markdown"
          fileText={report}
          copyText={report}
          downloadLabel={t('review.download')}
          copyLabel={t('review.copy')}
        />
      </section>
    </>
  );
}

/** Tool 1: review each of a state's rule values next to its source. */
export function ReviewTool() {
  const { t } = useTranslate();
  const [stateCode, setStateCode] = useState('');
  const adapter = stateCode ? loadAdapter(stateCode) : undefined;
  return (
    <>
      <p>{t('review.intro')}</p>
      <StatePicker value={stateCode} onChange={setStateCode} />
      {adapter && <StateReview key={adapter.stateCode} adapter={adapter} />}
    </>
  );
}
