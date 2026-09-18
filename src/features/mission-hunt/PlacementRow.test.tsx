import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlacementRow } from './PlacementRow';
import type { MissionHuntPlacement } from '../../types/missionHunt';

function placement(overrides: Partial<MissionHuntPlacement> = {}): MissionHuntPlacement {
  return {
    id: 'pl-1',
    ownerId: 'user-1',
    ownerEmail: 'bernard.drost@maandag.com',
    ownerDisplayName: 'Bernard',
    professionalName: 'Janny Hakkers',
    clientName: 'Gemeente Apeldoorn',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    hoursPerWeek: 1,
    monthlyDb: 14.59,
    note: null,
    fingerprint: 'fp',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('PlacementRow — privacy hotfix (display-only masking)', () => {
  it('shows the professional as initials only, never the full name', () => {
    render(<PlacementRow placement={placement()} onOpen={vi.fn()} />);
    expect(screen.getByText('J.H.')).toBeInTheDocument();
    expect(screen.queryByText('Janny Hakkers')).not.toBeInTheDocument();
  });

  it('shows the client city, never the real client name', () => {
    render(<PlacementRow placement={placement()} onOpen={vi.fn()} />);
    expect(screen.getByText(/Apeldoorn/)).toBeInTheDocument();
    expect(screen.queryByText(/Gemeente Apeldoorn/)).not.toBeInTheDocument();
  });

  it('falls back to LOCATIE ONBEKEND when no city can be derived, never the real client name', () => {
    render(<PlacementRow placement={placement({ clientName: 'Stichting Katholiek Onderwijs Flevoland-Veluwe' })} onOpen={vi.fn()} />);
    expect(screen.getByText(/LOCATIE ONBEKEND/)).toBeInTheDocument();
    expect(screen.queryByText(/Stichting/)).not.toBeInTheDocument();
  });

  it('rounds the displayed DB, never the decimal value', () => {
    render(<PlacementRow placement={placement({ monthlyDb: 14.59 })} onOpen={vi.fn()} />);
    expect(screen.getByText(/15 DB/)).toBeInTheDocument();
    expect(screen.queryByText(/14.59/)).not.toBeInTheDocument();
    expect(screen.queryByText(/14,59/)).not.toBeInTheDocument();
  });

  it('keeps FTE, calculated weekly hours, and dates fully visible', () => {
    render(<PlacementRow placement={placement({ hoursPerWeek: 0.4, startDate: '2026-08-31', endDate: '2026-11-30' })} onOpen={vi.fn()} />);
    expect(screen.getByText('0.4 FTE · 16 UUR')).toBeInTheDocument();
  });
});
