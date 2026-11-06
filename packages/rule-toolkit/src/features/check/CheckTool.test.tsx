import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import familyWithChildren from '../../../../../data/states/oh/fixtures/family-with-children.json';
import { CheckTool } from './CheckTool.js';

function jsonFile(name: string, value: unknown): File {
  return new File([JSON.stringify(value)], name, { type: 'application/json' });
}

describe('CheckTool', () => {
  it('shows a pass for every row of a repo fixture, with reasons and the math', async () => {
    const user = userEvent.setup();
    render(<CheckTool />);
    await user.upload(
      screen.getByLabelText('Test case file'),
      jsonFile('f.json', familyWithChildren),
    );
    expect(
      await screen.findByText('All 7 checks pass with the current Ohio rules.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Pass')).toHaveLength(7);
    expect(screen.queryByText('Mismatch')).not.toBeInTheDocument();

    const snap = screen
      .getByRole('heading', { level: 3, name: 'SNAP (food assistance)' })
      .closest('li');
    if (!snap) throw new Error('no SNAP row');
    expect(within(snap).getAllByText('You may well qualify')).toHaveLength(2);
    expect(within(snap).getByText('Show the math')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Medicaid / CHIP (health coverage) for Person 3 (child, age 6)',
      }),
    ).toBeInTheDocument();
  });

  it('shows a mismatch when the expectation differs', async () => {
    const user = userEvent.setup();
    render(<CheckTool />);
    const edited = {
      ...familyWithChildren,
      expected: { ...familyWithChildren.expected, tanf: 'eligible' },
    };
    await user.upload(screen.getByLabelText('Test case file'), jsonFile('f.json', edited));
    expect(
      await screen.findByText('1 of 7 checks do not match the current Ohio rules.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Mismatch')).toBeInTheDocument();
  });

  it('gives a friendly message for a file that is not a test case', async () => {
    const user = userEvent.setup();
    render(<CheckTool />);
    await user.upload(
      screen.getByLabelText('Test case file'),
      new File(['not json at all'], 'notes.json', { type: 'application/json' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'We could not read this file. Choose a test case file that ends in .json.',
    );
    await user.upload(screen.getByLabelText('Test case file'), jsonFile('x.json', { hello: 1 }));
    expect(await screen.findByText(/This file is not a test case/)).toBeInTheDocument();
  });
});
