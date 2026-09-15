import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissionHomepage } from './MissionHomepage';

describe('MissionHomepage — Mission Updates terminal', () => {
  it('renders a "04 Mission Updates" terminal alongside the existing three', () => {
    render(<MissionHomepage onSelect={vi.fn()} />);
    expect(screen.getByText('04')).toBeInTheDocument();
    expect(screen.getByText(/mission updates/i)).toBeInTheDocument();
    expect(screen.getByText(/view archive/i)).toBeInTheDocument();
  });

  it('shows a compact update-count badge, never a loud "NEW" banner', () => {
    render(<MissionHomepage onSelect={vi.fn()} />);
    expect(screen.getByText(/^\d+ UPDATES?$/i)).toBeInTheDocument();
  });

  it('clicking the terminal navigates to mission-updates', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MissionHomepage onSelect={onSelect} />);

    await user.click(screen.getByText(/view archive/i));
    expect(onSelect).toHaveBeenCalledWith('mission-updates');
  });

  it('leaves the existing three terminals untouched', () => {
    render(<MissionHomepage onSelect={vi.fn()} />);
    expect(screen.getByText('Mission Calculator')).toBeInTheDocument();
    expect(screen.getByText('League Check')).toBeInTheDocument();
    expect(screen.getByText('Mission Control')).toBeInTheDocument();
  });
});

describe('MissionHomepage — Mission Hunt terminal', () => {
  it('renders a "05 Mission Hunt" terminal', () => {
    render(<MissionHomepage onSelect={vi.fn()} />);
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByText('Mission Hunt')).toBeInTheDocument();
    expect(screen.getByText(/open mission/i)).toBeInTheDocument();
  });

  it('clicking the terminal navigates to mission-hunt', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MissionHomepage onSelect={onSelect} />);

    await user.click(screen.getByText(/open mission/i));
    expect(onSelect).toHaveBeenCalledWith('mission-hunt');
  });
});
