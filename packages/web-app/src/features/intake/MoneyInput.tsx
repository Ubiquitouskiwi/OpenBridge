import { useId } from 'react';

interface MoneyInputProps {
  label: string;
  /** Value in integer cents. */
  valueCents: number;
  onChangeCents: (cents: number) => void;
  hint?: string;
  example?: string;
}

/**
 * Money input with inline help and forgiving formatting (requirement 5.6.5, Q34).
 * Accepts values with or without a "$" and commas; stores integer cents.
 */
export function MoneyInput({ label, valueCents, onChangeCents, hint, example }: MoneyInputProps) {
  const id = useId();
  const display = valueCents ? (valueCents / 100).toString() : '';

  function handleChange(raw: string) {
    const cleaned = raw.replace(/[$,\s]/g, '');
    const dollars = Number.parseFloat(cleaned);
    onChangeCents(Number.isFinite(dollars) ? Math.round(dollars * 100) : 0);
  }

  return (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        inputMode="decimal"
        defaultValue={display}
        onBlur={(e) => handleChange(e.target.value)}
        placeholder={example ?? '0'}
      />
      {hint && <p className="field-hint">{hint}</p>}
    </label>
  );
}
