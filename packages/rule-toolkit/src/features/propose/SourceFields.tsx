import { useId } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';
import { SOURCE_NAME_MAX, type SourceDraft, type SourceErrors } from './buildProposal.js';

interface SourceFieldsProps {
  value: SourceDraft;
  errors: SourceErrors;
  showErrors: boolean;
  onChange: (value: SourceDraft) => void;
}

interface TextFieldProps {
  label: string;
  hint: string;
  value: string;
  type: 'text' | 'url' | 'date';
  error: string | undefined;
  maxLength?: number;
  onChange: (value: string) => void;
}

function TextField({ label, hint, value, type, error, maxLength, onChange }: TextFieldProps) {
  const id = useId();
  const hintId = useId();
  const errorId = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        required
        maxLength={maxLength}
        autoComplete="off"
        aria-invalid={error !== undefined}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        onChange={(e) => onChange(e.target.value)}
      />
      <p id={hintId} className="hint">
        {hint}
      </p>
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** The official source that backs every change in the proposal. */
export function SourceFields({ value, errors, showErrors, onChange }: SourceFieldsProps) {
  const { t } = useTranslate();
  const err = (key: keyof SourceErrors): string | undefined => {
    const code = errors[key];
    return showErrors && code ? t(`propose.sourceError.${key}.${code}`) : undefined;
  };
  return (
    <fieldset className="card">
      <legend>{t('propose.sourceLegend')}</legend>
      <p className="hint">{t('propose.sourceHelp')}</p>
      <TextField
        label={t('propose.sourceName')}
        hint={t('propose.sourceNameHint')}
        type="text"
        value={value.sourceName}
        maxLength={SOURCE_NAME_MAX}
        error={err('sourceName')}
        onChange={(sourceName) => onChange({ ...value, sourceName })}
      />
      <TextField
        label={t('propose.sourceUrl')}
        hint={t('propose.sourceUrlHint')}
        type="url"
        value={value.url}
        error={err('url')}
        onChange={(url) => onChange({ ...value, url })}
      />
      <TextField
        label={t('propose.sourceDate')}
        hint={t('propose.sourceDateHint')}
        type="date"
        value={value.publishedDate}
        error={err('publishedDate')}
        onChange={(publishedDate) => onChange({ ...value, publishedDate })}
      />
    </fieldset>
  );
}
