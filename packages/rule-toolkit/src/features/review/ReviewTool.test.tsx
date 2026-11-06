import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ruleFieldsFor } from '@openbridge/shared';
import { ohio } from '../../test-utils.js';
import { ReviewTool } from './ReviewTool.js';

describe('ReviewTool', () => {
  it('shows each value with its source and tracks progress', async () => {
    const user = userEvent.setup();
    render(<ReviewTool />);
    await user.selectOptions(screen.getByLabelText('State'), 'OH');
    const total = ruleFieldsFor(ohio()).length;
    expect(screen.getByText(`0 of ${total} checked`)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SNAP (food assistance)' })).toBeInTheDocument();

    const gross = screen.getByRole('group', { name: 'Income limit before deductions' });
    expect(within(gross).getByText('130% of the poverty line')).toBeInTheDocument();
    const link = within(gross).getByRole('link', { name: /Ohio Dept. of Job and Family Services/ });
    expect(link).toHaveAttribute('href', 'https://jfs.ohio.gov');
    expect(link).toHaveAttribute('target', '_blank');

    const asset = screen.getByRole('group', { name: 'Asset limit' });
    expect(within(asset).getByText('Not used')).toBeInTheDocument();
    expect(within(asset).getByText('No source listed yet')).toBeInTheDocument();

    await user.click(within(gross).getByLabelText('Does not match'));
    expect(screen.getByText(`1 of ${total} checked`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download report' })).toBeEnabled();
  });

  it('labels child tiers with their ages', async () => {
    const user = userEvent.setup();
    render(<ReviewTool />);
    await user.selectOptions(screen.getByLabelText('State'), 'TX');
    expect(
      screen.getByRole('group', { name: 'Income limit for children ages 2 to 5' }),
    ).toBeInTheDocument();
  });
});
