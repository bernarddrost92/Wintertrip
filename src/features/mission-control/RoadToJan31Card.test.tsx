import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoadToJan31Card } from './RoadToJan31Card';
import type { FteSnapshot } from '../../types/missionSnapshot';

function fte(overrides: Partial<FteSnapshot> = {}): FteSnapshot {
  return {
    baselineFte: null,
    projectedFteOnJan31: null,
    targetFteOnJan31: null,
    expiringBeforeJan31Fte: null,
    snapshotUpdatedAt: null,
    currentNetFte: null,
    netFteRanking: null,
    currentNumberOneBenchmark: null,
    currentFteFactor: null,
    fteMilestones: [],
    ...overrides,
  };
}

const MILESTONES = [
  { position: 8, team: 'Alkmaar', gapFte: 23.16 },
  { position: 5, team: 'Utrecht', gapFte: 39.31 },
  { position: 3, team: 'Breda', gapFte: 53.18 },
  { position: 1, team: 'Middelburg', gapFte: 55.41 },
];

describe('RoadToJan31Card — Next FTE Milestone (dominant)', () => {
  it('the nearest milestone (#8) is shown as the dominant Next FTE Milestone', () => {
    render(<RoadToJan31Card fte={fte({ currentNetFte: -79.01, netFteRanking: 9, fteMilestones: MILESTONES })} />);
    expect(screen.getAllByText('#8').length).toBeGreaterThan(0);
    expect(screen.getByText(/23,16 fte improvement needed/i)).toBeInTheDocument();
    expect(screen.getByText(/to current #8 · alkmaar/i)).toBeInTheDocument();
  });

  it('never words it as an absolute number of placements', () => {
    render(<RoadToJan31Card fte={fte({ currentNetFte: -79.01, fteMilestones: MILESTONES })} />);
    expect(screen.queryByText(/23,16 fte plaatsen/i)).not.toBeInTheDocument();
  });

  it('no milestones -> no Next FTE Milestone block', () => {
    render(<RoadToJan31Card fte={fte({ currentNetFte: -79.01, fteMilestones: [] })} />);
    expect(screen.queryByText(/next fte milestone/i)).not.toBeInTheDocument();
  });
});

describe('RoadToJan31Card — FTE Path', () => {
  it('renders the starting position and every milestone as a compact path', () => {
    render(<RoadToJan31Card fte={fte({ currentNetFte: -79.01, netFteRanking: 9, fteMilestones: MILESTONES })} />);
    expect(screen.getByText('#9')).toBeInTheDocument();
    expect(screen.getByText('-79,01')).toBeInTheDocument();
    expect(screen.getByText('+23,16')).toBeInTheDocument();
    expect(screen.getByText('+39,31')).toBeInTheDocument();
    expect(screen.getByText('+53,18')).toBeInTheDocument();
    expect(screen.getByText('+55,41')).toBeInTheDocument();
  });

  it('no current Net FTE -> no path rendered', () => {
    render(<RoadToJan31Card fte={fte({ currentNetFte: null, fteMilestones: MILESTONES })} />);
    expect(screen.queryByText('+23,16')).not.toBeInTheDocument();
  });
});

describe('RoadToJan31Card — at risk', () => {
  it('expiring FTE present -> AT RISK BEFORE 31 JAN visible, never worded as lost', () => {
    render(<RoadToJan31Card fte={fte({ expiringBeforeJan31Fte: 3.5 })} />);
    expect(screen.getByText(/at risk before 31 jan/i)).toBeInTheDocument();
    expect(screen.queryByText(/lost fte/i)).not.toBeInTheDocument();
  });

  it('no expiring FTE data -> AT RISK line is not shown', () => {
    render(<RoadToJan31Card fte={fte({ expiringBeforeJan31Fte: null })} />);
    expect(screen.queryByText(/at risk before 31 jan/i)).not.toBeInTheDocument();
  });
});

describe('RoadToJan31Card — secondary 31 Jan FTE Target block', () => {
  it('no fixed target yet -> a small "31 Jan FTE Target / Awaiting Intelligence" block, not large empty boxes', () => {
    render(<RoadToJan31Card fte={fte()} />);
    expect(screen.getByText(/31 jan fte target/i)).toBeInTheDocument();
    expect(screen.getByText(/awaiting intelligence/i)).toBeInTheDocument();
    expect(screen.queryByText(/current \/ baseline fte/i)).not.toBeInTheDocument();
  });

  it('target 30, projected 27.5 -> compact Projected/Target/Gap row', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 30, projectedFteOnJan31: 27.5 })} />);
    expect(screen.getByText('27,50')).toBeInTheDocument();
    expect(screen.getByText('30,00')).toBeInTheDocument();
    expect(screen.getByText(/gap 2,50 fte/i)).toBeInTheDocument();
  });

  it('target 30, projected 30 -> Target Secured, no fabricated gap', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 30, projectedFteOnJan31: 30 })} />);
    expect(screen.getByText(/target secured/i)).toBeInTheDocument();
    expect(screen.queryByText(/gap \d/i)).not.toBeInTheDocument();
  });

  it('target 30, projected 31.2 -> Target Secured + buffer', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 30, projectedFteOnJan31: 31.2 })} />);
    expect(screen.getByText(/target secured · \+1,20 fte buffer/i)).toBeInTheDocument();
  });

  it('target known, projected missing -> Projected FTE Pending, never a fabricated gap', () => {
    render(<RoadToJan31Card fte={fte({ targetFteOnJan31: 25, projectedFteOnJan31: null })} />);
    expect(screen.getByText(/projected fte pending/i)).toBeInTheDocument();
    expect(screen.queryByText(/gap \d/i)).not.toBeInTheDocument();
  });
});
