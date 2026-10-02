import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IntelligenceStatusSection } from './IntelligenceStatusSection';

describe('IntelligenceStatusSection', () => {
  it('shows the Power BI last refresh as a manual snapshot', () => {
    render(<IntelligenceStatusSection powerBiUpdatedAt="2026-09-09T05:07:00+02:00" />);
    expect(screen.getByText('09 SEP 2026 · 05:07')).toBeInTheDocument();
    expect(screen.getByText(/manual snapshot/i)).toBeInTheDocument();
  });

  it('no longer shows the Marre production feed sync, refresh control or data quality', () => {
    render(<IntelligenceStatusSection powerBiUpdatedAt="2026-09-09T05:07:00+02:00" />);
    expect(screen.queryByText(/marre production feed/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /refresh data/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/data quality/i)).not.toBeInTheDocument();
  });

  it('a date-only snapshot (no reliable refresh time) renders just the date, never a fabricated time', () => {
    render(<IntelligenceStatusSection powerBiUpdatedAt="2026-09-10" />);
    expect(screen.getByText('10 SEP 2026')).toBeInTheDocument();
    expect(screen.queryByText(/10 sep 2026 ·/i)).not.toBeInTheDocument();
  });

  it('no Power BI timestamp -> Awaiting Update', () => {
    render(<IntelligenceStatusSection powerBiUpdatedAt={null} />);
    expect(screen.getByText(/awaiting update/i)).toBeInTheDocument();
  });
});
