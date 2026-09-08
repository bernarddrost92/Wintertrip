import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccessGate } from './AccessGate';
import { hasAccess } from './accessStorage';

describe('AccessGate', () => {
  it('A. is shown with no stored access — the code input and AUTHORIZE are visible', () => {
    render(<AccessGate onAuthorized={vi.fn()} />);
    expect(screen.getByLabelText(/enter access code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /authorize/i })).toBeInTheDocument();
  });

  it('B. the exact code "Zwolle" grants access, persists it, and calls onAuthorized', async () => {
    const user = userEvent.setup();
    const onAuthorized = vi.fn();
    render(<AccessGate onAuthorized={onAuthorized} />);

    await user.type(screen.getByLabelText(/enter access code/i), 'Zwolle');
    await user.click(screen.getByRole('button', { name: /authorize/i }));

    expect(onAuthorized).toHaveBeenCalledTimes(1);
    expect(hasAccess()).toBe(true);
  });

  it('Enter submits the form, not just clicking Authorize', async () => {
    const user = userEvent.setup();
    const onAuthorized = vi.fn();
    render(<AccessGate onAuthorized={onAuthorized} />);

    await user.type(screen.getByLabelText(/enter access code/i), 'Zwolle{Enter}');

    expect(onAuthorized).toHaveBeenCalledTimes(1);
  });

  it('C. a wrong password shows Access Denied and never authorizes', async () => {
    const user = userEvent.setup();
    const onAuthorized = vi.fn();
    render(<AccessGate onAuthorized={onAuthorized} />);

    await user.type(screen.getByLabelText(/enter access code/i), 'zwolle{Enter}');

    expect(await screen.findByText(/access denied/i)).toBeInTheDocument();
    expect(onAuthorized).not.toHaveBeenCalled();
    expect(hasAccess()).toBe(false);
  });

  it('rejects an all-caps variant — the check is case-sensitive', async () => {
    const user = userEvent.setup();
    const onAuthorized = vi.fn();
    render(<AccessGate onAuthorized={onAuthorized} />);

    await user.type(screen.getByLabelText(/enter access code/i), 'ZWOLLE{Enter}');

    expect(await screen.findByText(/access denied/i)).toBeInTheDocument();
    expect(onAuthorized).not.toHaveBeenCalled();
  });
});
