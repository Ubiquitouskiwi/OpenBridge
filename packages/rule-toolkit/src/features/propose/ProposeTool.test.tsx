import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProposeTool } from './ProposeTool.js';

async function fillSource(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name of the source'), 'Ohio SNAP Policy Manual');
  await user.type(screen.getByLabelText('Web address of the source'), 'https://example.org/manual');
  await user.type(screen.getByLabelText('Date the source was published'), '2025-10-01');
  await user.type(screen.getByLabelText('Why should this change?'), 'The new table says 200.');
}

describe('ProposeTool', () => {
  it('shows the current value and enables download once the proposal checks out', async () => {
    const user = userEvent.setup();
    render(<ProposeTool />);
    await user.selectOptions(screen.getByLabelText('State'), 'OH');
    await user.selectOptions(screen.getByLabelText('Program'), 'snap');
    await user.selectOptions(screen.getByLabelText('Rule value'), 'snap.grossIncomeLimitPct');
    const change = screen.getByRole('group', { name: 'Change 1' });
    expect(within(change).getByText('130% of the poverty line')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Download proposal file' }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('New percent of the poverty line'), '200');
    await fillSource(user);
    expect(screen.getByText('Your proposal is ready.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download proposal file' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Copy issue text' })).toBeEnabled();
  });

  it('shows plain errors next to the fields', async () => {
    const user = userEvent.setup();
    render(<ProposeTool />);
    await user.selectOptions(screen.getByLabelText('State'), 'OH');
    await user.selectOptions(screen.getByLabelText('Program'), 'tanf');
    await user.selectOptions(screen.getByLabelText('Rule value'), 'tanf.baseMonthlyLimitCents');
    await user.type(screen.getByLabelText('New dollar amount'), 'six hundred');
    await user.type(screen.getByLabelText('Web address of the source'), 'http://example.org');
    await user.click(screen.getByRole('button', { name: 'Check my proposal' }));

    const amount = screen.getByLabelText('New dollar amount');
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(amount).toHaveAccessibleDescription(
      /Enter a dollar amount, for example 2,750 or 2750.50/,
    );
    expect(screen.getByLabelText('Web address of the source')).toHaveAccessibleDescription(
      /starts with https:\/\//,
    );
    expect(screen.getByText('Enter the name of the source.')).toBeInTheDocument();
    expect(screen.getByText('Tell us why this should change.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Some parts need a fix.');
  });

  it('adds a second change backed by the same source', async () => {
    const user = userEvent.setup();
    render(<ProposeTool />);
    await user.selectOptions(screen.getByLabelText('State'), 'OH');
    await user.click(
      screen.getByRole('button', { name: 'Add another change from the same source' }),
    );
    expect(screen.getByRole('group', { name: 'Change 2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove change 2' }));
    expect(screen.queryByRole('group', { name: 'Change 2' })).not.toBeInTheDocument();
  });
});
