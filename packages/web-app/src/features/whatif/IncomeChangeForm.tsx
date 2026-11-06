import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoneyInput } from '../intake/MoneyInput.js';
import { formatWholeDollars } from '../results/calcFormat.js';
import { QUICK_INCREASES_CENTS, type Direction } from './whatIfSummary.js';

interface IncomeChangeFormProps {
  direction: Direction;
  amountCents: number;
  onDirection: (d: Direction) => void;
  onAmount: (cents: number) => void;
}

/** Picks a monthly income change: up or down, an amount, or a quick raise button. */
export function IncomeChangeForm({
  direction,
  amountCents,
  onDirection,
  onAmount,
}: IncomeChangeFormProps) {
  const { t, i18n } = useTranslation();
  // Remounts the uncontrolled MoneyInput so a quick pick shows in the field.
  const [inputKey, setInputKey] = useState(0);

  function pickQuick(cents: number) {
    onDirection('more');
    onAmount(cents);
    setInputKey((k) => k + 1);
  }

  return (
    <>
      <fieldset>
        <legend>{t('whatif.directionLegend')}</legend>
        {(['more', 'less'] as Direction[]).map((d) => (
          <label key={d}>
            <input
              type="radio"
              name="whatif-direction"
              value={d}
              checked={direction === d}
              onChange={() => onDirection(d)}
            />{' '}
            {t(`whatif.${d}`)}
          </label>
        ))}
        <MoneyInput
          key={inputKey}
          label={t('whatif.amountLabel')}
          valueCents={amountCents}
          onChangeCents={(c) => onAmount(Math.abs(c))}
          hint={t('whatif.amountHint')}
        />
      </fieldset>

      <fieldset>
        <legend>{t('whatif.quickLegend')}</legend>
        <div className="button-row">
          {QUICK_INCREASES_CENTS.map((c) => (
            <button key={c} type="button" onClick={() => pickQuick(c)}>
              {t('whatif.quick', { amount: formatWholeDollars(i18n.language, c) })}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
}
