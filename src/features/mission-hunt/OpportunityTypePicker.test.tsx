import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OpportunityTypePicker } from './OpportunityTypePicker';

describe('OpportunityTypePicker — opportunity type selection', () => {
  it('toggling a chip adds it to the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OpportunityTypePicker selected={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /eerder starten/i }));
    expect(onChange).toHaveBeenCalledWith(['earlier_start']);
  });

  it('toggling an already-selected chip removes it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OpportunityTypePicker selected={['earlier_start', 'more_vcdb']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /eerder starten/i }));
    expect(onChange).toHaveBeenCalledWith(['more_vcdb']);
  });

  it('supports multiple selections at once', () => {
    render(<OpportunityTypePicker selected={['earlier_start', 'more_vcdb', 'keep_fte']} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /eerder starten/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /meer vcdb/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /\+4 uur/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('is never required to have a selection — an empty selection renders fine with no error', () => {
    render(<OpportunityTypePicker selected={[]} onChange={vi.fn()} />);
    expect(screen.queryByText(/verplicht/i)).not.toBeInTheDocument();
  });

  it('when disabled, clicking a chip does not call onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OpportunityTypePicker selected={[]} onChange={onChange} disabled />);

    await user.click(screen.getByRole('button', { name: /eerder starten/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
