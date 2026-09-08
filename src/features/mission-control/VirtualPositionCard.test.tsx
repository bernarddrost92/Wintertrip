import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualPositionCard } from './VirtualPositionCard';
import type { RankingSnapshot } from '../../types/missionSnapshot';

function snapshot(virtualPosition: number | null): RankingSnapshot {
  return { virtualPosition, snapshotUpdatedAt: null };
}

describe('VirtualPositionCard', () => {
  it('virtualPosition = 1 -> gold state, #1, GOLD POSITION', () => {
    render(<VirtualPositionCard ranking={snapshot(1)} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText(/gold position/i)).toBeInTheDocument();
    expect(screen.getByText('#1').closest('[data-podium-state]')).toHaveAttribute('data-podium-state', 'gold');
  });

  it('virtualPosition = 2 -> silver state, #2, SILVER POSITION', () => {
    render(<VirtualPositionCard ranking={snapshot(2)} />);
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText(/silver position/i)).toBeInTheDocument();
    expect(screen.getByText('#2').closest('[data-podium-state]')).toHaveAttribute('data-podium-state', 'silver');
  });

  it('virtualPosition = 3 -> bronze state, #3, BRONZE POSITION', () => {
    render(<VirtualPositionCard ranking={snapshot(3)} />);
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText(/bronze position/i)).toBeInTheDocument();
    expect(screen.getByText('#3').closest('[data-podium-state]')).toHaveAttribute('data-podium-state', 'bronze');
  });

  it('virtualPosition = 4 -> default state, #4, IN PURSUIT, no medal styling', () => {
    render(<VirtualPositionCard ranking={snapshot(4)} />);
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText(/in pursuit/i)).toBeInTheDocument();
    expect(screen.getByText('#4').closest('[data-podium-state]')).toHaveAttribute('data-podium-state', 'default');
  });

  it('virtualPosition = null -> Awaiting Intelligence, no fabricated #0', () => {
    render(<VirtualPositionCard ranking={snapshot(null)} />);
    expect(screen.getByText(/awaiting intelligence/i)).toBeInTheDocument();
    expect(screen.queryByText('#0')).not.toBeInTheDocument();
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  });

  it('the position number is dynamic, not hardcoded', () => {
    render(<VirtualPositionCard ranking={snapshot(7)} />);
    expect(screen.getByText('#7')).toBeInTheDocument();
  });
});
