import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatusFilterBar } from './StatusFilterBar';

describe('StatusFilterBar — filters', () => {
  it('shows ALL plus every status as a chip', () => {
    render(<StatusFilterBar value="all" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kans/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /uitzoeken/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /geen actie/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nog beoordelen/i })).toBeInTheDocument();
  });

  it('clicking KANS calls onChange with "opportunity"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusFilterBar value="all" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /kans/i }));
    expect(onChange).toHaveBeenCalledWith('opportunity');
  });

  it('marks the active filter as pressed', () => {
    render(<StatusFilterBar value="opportunity" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /kans/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ALL' })).toHaveAttribute('aria-pressed', 'false');
  });
});
