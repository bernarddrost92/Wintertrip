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

  it('shows the new structure: Score Check, Net FTE and Mission Control — no separate Calculator/League Check', () => {
    render(<MissionHomepage onSelect={vi.fn()} />);
    expect(screen.getByText('Score Check')).toBeInTheDocument();
    expect(screen.getByText('Net FTE')).toBeInTheDocument();
    expect(screen.getByText('Mission Control')).toBeInTheDocument();
    expect(screen.queryByText('Mission Calculator')).not.toBeInTheDocument();
    expect(screen.queryByText('League Check')).not.toBeInTheDocument();
  });

  it.each([
    [/start score check/i, 'score-check'],
    [/open net fte/i, 'net-fte'],
  ])('the %s terminal navigates to %s', async (cta, view) => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MissionHomepage onSelect={onSelect} />);

    await user.click(screen.getByText(cta));
    expect(onSelect).toHaveBeenCalledWith(view);
  });
});

describe('MissionHomepage — Mission Hunt is no longer part of the site', () => {
  it('renders no Mission Hunt terminal', () => {
    render(<MissionHomepage onSelect={vi.fn()} />);
    expect(screen.queryByText('05')).not.toBeInTheDocument();
    expect(screen.queryByText('Mission Hunt')).not.toBeInTheDocument();
    expect(screen.queryByText(/open mission/i)).not.toBeInTheDocument();
  });
});
