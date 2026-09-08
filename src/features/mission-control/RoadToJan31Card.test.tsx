import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoadToJan31Card } from './RoadToJan31Card';
import type { FteSnapshot } from '../../types/missionSnapshot';

function fte(overrides: Partial<FteSnapshot> = {}): FteSnapshot {
  return {
    baselineFte: 20,
    projectedFteOnJan31: null,
    targetFteOnJan31: null,
    expiringBeforeJan31Fte: null,
    snapshotUpdatedAt: null,
    ...overrides,
  };
}

describe('RoadToJan31Card', () => {
  it('target 30, projected 27.5 -> shows the gap dominant', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 30, projectedFteOnJan31: 27.5 })} />);
    expect(screen.getByText(/nog 2,50 fte nodig/i)).toBeInTheDocument();
  });

  it('target 30, projected 30 -> secured, no buffer line', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 30, projectedFteOnJan31: 30 })} />);
    expect(screen.getByText(/fte target secured/i)).toBeInTheDocument();
    expect(screen.queryByText(/fte buffer/i)).not.toBeInTheDocument();
  });

  it('target 30, projected 31.2 -> secured + 1,20 FTE buffer', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 30, projectedFteOnJan31: 31.2 })} />);
    expect(screen.getByText(/fte target secured/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1,20 fte buffer/i)).toBeInTheDocument();
  });

  it('target null -> AWAITING TARGET, and projected FTE still shown, never a fabricated gap', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: null, projectedFteOnJan31: 18 })} />);
    expect(screen.getByText(/awaiting target/i)).toBeInTheDocument();
    expect(screen.getByText('18,00')).toBeInTheDocument();
    expect(screen.queryByText(/fte nodig/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fte target secured/i)).not.toBeInTheDocument();
  });

  it('projected null (target known) -> no fabricated gap value', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 25, projectedFteOnJan31: null })} />);
    expect(screen.queryByText(/fte nodig/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fte target secured/i)).not.toBeInTheDocument();
    expect(screen.getByText(/projected fte pending/i)).toBeInTheDocument();
  });

  it('expiring FTE present -> AT RISK BEFORE 31 JAN visible, never worded as lost', () => {
    render(<RoadToJan31Card fte={fte({ expiringBeforeJan31Fte: 3.5 })} />);
    expect(screen.getByText(/at risk before 31 jan/i)).toBeInTheDocument();
    expect(screen.queryByText(/lost fte/i)).not.toBeInTheDocument();
  });

  it('no expiring FTE data -> AT RISK line is not shown', () => {
    render(<RoadToJan31Card fte={fte({ expiringBeforeJan31Fte: null })} />);
    expect(screen.queryByText(/at risk before 31 jan/i)).not.toBeInTheDocument();
  });

  it('no snapshot timestamp -> AWAITING UPDATE', () => {
    render(<RoadToJan31Card fte={fte({ snapshotUpdatedAt: null })} />);
    expect(screen.getByText(/awaiting update/i)).toBeInTheDocument();
  });

  it('a snapshot timestamp -> UPDATED · <time>', () => {
    render(<RoadToJan31Card fte={fte({ snapshotUpdatedAt: '2026-11-01T09:30:00.000Z' })} />);
    expect(screen.getByText(/updated ·/i)).toBeInTheDocument();
  });

  it('progress bar renders with both figures known, and shows the overage when target exceeded', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 28, projectedFteOnJan31: 29.2 })} />);
    expect(screen.getByText(/29,20 \/ 28,00 fte/i)).toBeInTheDocument();
    expect(screen.getByText(/target \+ 1,20 fte/i)).toBeInTheDocument();
  });

  it('progress bar is absent when the target is missing', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: null, projectedFteOnJan31: 20 })} />);
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });
});
