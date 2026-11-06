import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedStates } from '../data/index.js';

interface StatePickerProps {
  value: string;
  onChange: (code: string) => void;
}

/** Choose one of the states the toolkit has rules for. */
export function StatePicker({ value, onChange }: StatePickerProps) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{t('common.stateLabel')}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('common.statePlaceholder')}</option>
        {supportedStates.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
