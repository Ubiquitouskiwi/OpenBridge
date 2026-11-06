import { useId } from 'react';
import { readRuleValue } from '@openbridge/shared';
import type { RuleField, StateAdapter } from '@openbridge/shared';
import { SourceCitation } from '../../components/SourceCitation.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { citationForField } from '../../lib/citations.js';
import { fieldLabel, formatRuleValue } from '../../lib/format.js';
import { REVIEW_STATUSES, type ReviewEntry, type ReviewStatus } from './reviewReport.js';

interface ReviewFieldRowProps {
  adapter: StateAdapter;
  field: RuleField;
  entry: ReviewEntry | undefined;
  onChange: (entry: ReviewEntry) => void;
}

/** One rule value next to its source, with the reviewer's check and note. */
export function ReviewFieldRow({ adapter, field, entry, onChange }: ReviewFieldRowProps) {
  const { t, locale } = useTranslate();
  const noteId = useId();
  const groupName = useId();
  const label = fieldLabel(t, adapter, field);
  const current: ReviewEntry = entry ?? { note: '' };

  function setStatus(status: ReviewStatus) {
    onChange({ ...current, status });
  }

  return (
    <li className="card review-row">
      <fieldset>
        <legend>{label}</legend>
        <dl className="facts">
          <div>
            <dt>{t('review.valueLabel')}</dt>
            <dd className="rule-value">
              {formatRuleValue(t, locale, field, readRuleValue(adapter, field.path))}
            </dd>
          </div>
          <div>
            <dt>{t('review.sourceLabel')}</dt>
            <dd>
              <SourceCitation citation={citationForField(adapter, field)} />
            </dd>
          </div>
        </dl>
        <fieldset className="choice-group">
          <legend>{t('review.checkLegend')}</legend>
          {REVIEW_STATUSES.map((status) => (
            <label key={status} className="choice">
              <input
                type="radio"
                name={groupName}
                value={status}
                checked={current.status === status}
                onChange={() => setStatus(status)}
              />{' '}
              {t(`review.status.${status}`)}
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor={noteId}>{t('review.noteLabel')}</label>
          <textarea
            id={noteId}
            rows={2}
            value={current.note}
            autoComplete="off"
            onChange={(e) => onChange({ ...current, note: e.target.value })}
          />
        </div>
      </fieldset>
    </li>
  );
}
