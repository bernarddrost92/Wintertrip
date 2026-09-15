import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatusPicker } from './StatusPicker';

describe('StatusPicker — status update', () => {
  it('one tap on the pill opens the menu, one tap on a status saves it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusPicker status="unreviewed" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /nog beoordelen/i }));
    await user.click(screen.getByRole('menuitem', { name: /kans/i }));

    expect(onChange).toHaveBeenCalledWith('opportunity');
  });

  it('shows subtle save feedback after a change', async () => {
    const user = userEvent.setup();
    render(<StatusPicker status="unreviewed" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /nog beoordelen/i }));
    await user.click(screen.getByRole('menuitem', { name: /kans/i }));

    expect(screen.getByText(/opgeslagen/i)).toBeInTheDocument();
  });

  it('selecting the already-current status does not call onChange again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatusPicker status="opportunity" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /kans/i }));
    await user.click(screen.getByRole('menuitem', { name: /^kans$/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('when disabled, renders a plain read-only pill with no menu', () => {
    const onChange = vi.fn();
    render(<StatusPicker status="opportunity" onChange={onChange} disabled />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/kans/i)).toBeInTheDocument();
  });
});
