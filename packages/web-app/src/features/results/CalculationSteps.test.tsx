import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { CalculationStep, FederalData, StateAdapter } from '@openbridge/shared';
import i18n from '../../i18n/config.js';
import enMath from '../../i18n/locales/en/math.json';
import { CalculationSteps } from './CalculationSteps.js';

const federal = {
  sources: [
    {
      field: 'fplTables',
      sourceName: 'HHS Poverty Guidelines',
      url: 'https://example.gov/fpl',
      publishedDate: '2024-01-17',
    },
  ],
} as unknown as FederalData;

const adapter = {
  sources: [],
  verificationStatus: 'draft',
} as unknown as StateAdapter;

const steps: CalculationStep[] = [
  { labelCode: 'CALC_GROSS_MONTHLY_INCOME', value: 200000, unit: 'cents', op: 'input' },
  {
    labelCode: 'CALC_FPL_ANNUAL',
    value: 1506000,
    unit: 'cents',
    op: 'rule',
    source: { scope: 'federal', field: 'fplTables' },
  },
  {
    labelCode: 'CALC_LIMIT_PCT_OF_FPL',
    value: 130,
    unit: 'pct',
    op: 'rule',
    source: { scope: 'state', field: 'snap.grossIncomeLimitPct' },
  },
  { labelCode: 'CALC_SNAP_STANDARD_DEDUCTION', value: 19800, unit: 'cents', op: 'subtract' },
  { labelCode: 'CALC_MONTHLY_INCOME_LIMIT', value: 163150, unit: 'cents', op: 'limit' },
  { labelCode: 'CALC_HOUSEHOLD_SIZE', value: 2, unit: 'count', op: 'result' },
];

function rowFor(label: string): HTMLElement {
  return screen.getByRole('rowheader', { name: label }).closest('tr') as HTMLElement;
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('CalculationSteps', () => {
  it('renders nothing when there are no steps', () => {
    const { container } = render(
      <CalculationSteps steps={undefined} adapter={adapter} federal={federal} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows localized labels and formatted values', () => {
    render(<CalculationSteps steps={steps} adapter={adapter} federal={federal} />);
    expect(screen.getByText('Show the math')).toBeInTheDocument();
    const income = rowFor(enMath.CALC_GROSS_MONTHLY_INCOME);
    expect(within(income).getByText('$2,000.00')).toBeInTheDocument();
    expect(within(income).getByText('From your answers')).toBeInTheDocument();
    expect(within(rowFor(enMath.CALC_LIMIT_PCT_OF_FPL)).getByText('130%')).toBeInTheDocument();
    expect(within(rowFor(enMath.CALC_HOUSEHOLD_SIZE)).getByText('equals 2')).toBeInTheDocument();
  });

  it('marks subtract and limit rows in words', () => {
    render(<CalculationSteps steps={steps} adapter={adapter} federal={federal} />);
    const deduction = rowFor(enMath.CALC_SNAP_STANDARD_DEDUCTION);
    expect(within(deduction).getByText('minus $198.00')).toBeInTheDocument();
    const limit = rowFor(enMath.CALC_MONTHLY_INCOME_LIMIT);
    expect(within(limit).getByText('Limit: $1,631.50')).toBeInTheDocument();
  });

  it('links a cited source and says so plainly when a source is missing', () => {
    render(<CalculationSteps steps={steps} adapter={adapter} federal={federal} />);
    const link = within(rowFor(enMath.CALC_FPL_ANNUAL)).getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.gov/fpl');
    expect(link).toHaveTextContent('HHS Poverty Guidelines, published Jan 17, 2024');
    const pct = rowFor(enMath.CALC_LIMIT_PCT_OF_FPL);
    expect(within(pct).getByText('Source not listed yet')).toBeInTheDocument();
    expect(within(pct).queryByRole('link')).toBeNull();
  });

  it('notes when the state rules are drafts', () => {
    render(<CalculationSteps steps={steps} adapter={adapter} federal={federal} />);
    expect(screen.getByText(/rules are drafts/)).toBeInTheDocument();
  });
});
