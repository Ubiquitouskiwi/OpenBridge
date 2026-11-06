import { useId } from 'react';
import { findRuleField, readRuleValue, ruleFieldsFor } from '@openbridge/shared';
import type { RuleField, StateAdapter } from '@openbridge/shared';
import { SourceCitation } from '../../components/SourceCitation.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { citationForField } from '../../lib/citations.js';
import { fieldLabel, formatRuleValue } from '../../lib/format.js';
import type { ChangeDraft, ChangeError, ValueChoice } from './buildProposal.js';

interface ChangeEditorProps {
  adapter: StateAdapter;
  index: number;
  draft: ChangeDraft;
  /** Shown only after the person tries to finish, so empty fields do not shout at first. */
  error: ChangeError | undefined;
  onChange: (draft: ChangeDraft) => void;
  onRemove?: () => void;
}

function ValueInput({
  field,
  draft,
  errorId,
  hasError,
  onChange,
}: {
  field: RuleField;
  draft: ChangeDraft;
  errorId: string;
  hasError: boolean;
  onChange: (draft: ChangeDraft) => void;
}) {
  const { t } = useTranslate();
  const amountId = useId();
  const hintId = useId();
  const choiceName = useId();
  const describedBy = hasError ? `${hintId} ${errorId}` : hintId;
  const choices: ValueChoice[] = field.unit === 'boolean' ? ['yes', 'no'] : [];
  if (field.nullable) choices.push('notUsed');
  const notUsed = draft.choice === 'notUsed';

  return (
    <fieldset className="choice-group">
      <legend>{t('propose.newValueLegend')}</legend>
      {field.unit !== 'boolean' && (
        <div className="field">
          <label htmlFor={amountId}>{t(`propose.amountLabel.${field.unit}`)}</label>
          <input
            id={amountId}
            inputMode="decimal"
            autoComplete="off"
            value={draft.amount}
            disabled={notUsed}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            onChange={(e) => onChange({ ...draft, amount: e.target.value })}
          />
        </div>
      )}
      <p id={hintId} className="hint">
        {t(`propose.amountHint.${field.unit}`)}
      </p>
      {choices.map((choice) => (
        <label key={choice} className="choice">
          <input
            type={field.unit === 'boolean' ? 'radio' : 'checkbox'}
            name={choiceName}
            checked={draft.choice === choice}
            aria-describedby={field.unit === 'boolean' ? describedBy : undefined}
            onChange={(e) =>
              onChange({
                ...draft,
                choice: e.target.checked || field.unit === 'boolean' ? choice : '',
              })
            }
          />{' '}
          {t(`propose.choice.${choice}`)}
        </label>
      ))}
    </fieldset>
  );
}

/** One proposed change: program, rule value, what it is now, and the new value. */
export function ChangeEditor({
  adapter,
  index,
  draft,
  error,
  onChange,
  onRemove,
}: ChangeEditorProps) {
  const { t, locale } = useTranslate();
  const programId = useId();
  const fieldId = useId();
  const errorId = useId();
  const fields = ruleFieldsFor(adapter);
  const programs = [...new Set(fields.map((f) => f.program))];
  const field = draft.path ? findRuleField(adapter, draft.path) : undefined;

  return (
    <fieldset className="card">
      <legend>{t('propose.changeLegend', { n: index + 1 })}</legend>
      <div className="field">
        <label htmlFor={programId}>{t('propose.programLabel')}</label>
        <select
          id={programId}
          value={draft.program}
          onChange={(e) =>
            onChange({ ...draft, program: e.target.value, path: '', amount: '', choice: '' })
          }
        >
          <option value="">{t('propose.programPlaceholder')}</option>
          {programs.map((p) => (
            <option key={p} value={p}>
              {t(`app:programs.${p}`)}
            </option>
          ))}
        </select>
      </div>
      {draft.program && (
        <div className="field">
          <label htmlFor={fieldId}>{t('propose.fieldLabel')}</label>
          <select
            id={fieldId}
            value={draft.path}
            aria-invalid={error === 'fieldRequired' || error === 'duplicate'}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange({ ...draft, path: e.target.value, amount: '', choice: '' })}
          >
            <option value="">{t('propose.fieldPlaceholder')}</option>
            {fields
              .filter((f) => f.program === draft.program)
              .map((f) => (
                <option key={f.path} value={f.path}>
                  {fieldLabel(t, adapter, f)}
                </option>
              ))}
          </select>
        </div>
      )}
      {field && (
        <>
          <dl className="facts">
            <div>
              <dt>{t('propose.currentValue')}</dt>
              <dd className="rule-value">
                {formatRuleValue(t, locale, field, readRuleValue(adapter, field.path))}
              </dd>
            </div>
            <div>
              <dt>{t('propose.currentSource')}</dt>
              <dd>
                <SourceCitation citation={citationForField(adapter, field)} />
              </dd>
            </div>
          </dl>
          <ValueInput
            field={field}
            draft={draft}
            errorId={errorId}
            hasError={error !== undefined}
            onChange={onChange}
          />
        </>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {t(`propose.changeError.${error}`)}
        </p>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove}>
          {t('propose.removeChange', { n: index + 1 })}
        </button>
      )}
    </fieldset>
  );
}
