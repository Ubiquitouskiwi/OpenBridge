import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.js';

describe('App', () => {
  it('explains the tools and the ground rules on the home screen', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'OpenBridge Rule Toolkit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: "Review a state's rules" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Propose a rule change' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Check a test case' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nothing you type here is sent anywhere/)).toBeInTheDocument();
    expect(screen.getByText(/Eligibility rule correction/)).toBeInTheDocument();
    expect(screen.getByText(/openbridge@starlingtek.com/)).toBeInTheDocument();
    expect(screen.getAllByText('Toolkit version 0.1.0. Rules data version 2024.')).not.toHaveLength(
      0,
    );
  });

  it('opens a tool and moves focus to its heading', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Check a test case' }));
    const heading = screen.getByRole('heading', { level: 1, name: 'Check a test case' });
    expect(heading).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Check a test case' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
