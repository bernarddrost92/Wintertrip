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

describe('RoadToJan31Card — Power BI Net FTE benchmark', () => {
  it('current -79.01 vs current #1 benchmark -23.60 -> gap to current #1 = 55,41 FTE, no fixed-target wording', () => {
    render(
      <RoadToJan31Card
        fte={fte({
          currentNetFte: -79.01,
          netFteRanking: 9,
          currentNumberOneBenchmark: -23.6,
          currentFteFactor: 1.3,
        })}
      />,
    );
    expect(screen.getByText('#9')).toBeInTheDocument();
    expect(screen.getByText('-79,01')).toBeInTheDocument();
    expect(screen.getByText('-23,60')).toBeInTheDocument();
    expect(screen.getByText(/55,41 fte/i)).toBeInTheDocument();
    expect(screen.getByText(/dynamic benchmark/i)).toBeInTheDocument();
    expect(screen.queryByText(/nog .* fte nodig/i)).not.toBeInTheDocument();
  });

  it('renders FTE milestones as improvement-needed, never with "lost" or "already realized" wording', () => {
    render(
      <RoadToJan31Card
        fte={fte({
          currentNetFte: -79.01,
          currentNumberOneBenchmark: -23.6,
          fteMilestones: [
            { position: 8, gapFte: 23.16 },
            { position: 5, gapFte: 39.31 },
            { position: 3, gapFte: 53.18 },
            { position: 1, gapFte: 55.41 },
          ],
        })}
      />,
    );
    expect(screen.getByText('+23,16 FTE')).toBeInTheDocument();
    expect(screen.getByText('+39,31 FTE')).toBeInTheDocument();
    expect(screen.getByText('+53,18 FTE')).toBeInTheDocument();
    expect(screen.getByText('+55,41 FTE')).toBeInTheDocument();
    expect(screen.getByText(/improvement needed/i)).toBeInTheDocument();
  });

  it('current FTE factor renders as 1,3x', () => {
    render(<RoadToJan31Card fte={fte({ currentNetFte: -79.01, currentNumberOneBenchmark: -23.6, currentFteFactor: 1.3 })} />);
    expect(screen.getByText('1,3x')).toBeInTheDocument();
  });

  it('no benchmark data -> no benchmark block, and the old fixed-target UI is unaffected', () => {
    render(<RoadToJan31Card fte={fte()} />);
    expect(screen.queryByText(/current #1 benchmark/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dynamic benchmark/i)).not.toBeInTheDocument();
    expect(screen.getByText(/awaiting target/i)).toBeInTheDocument();
  });
});
