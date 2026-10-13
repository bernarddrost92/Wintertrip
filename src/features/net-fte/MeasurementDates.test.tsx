import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MeasurementDates } from './MeasurementDates';

describe('MeasurementDates', () => {
  it('shows the start measurement (1 Sep 2026) against the meetdatum (31 Jan 2027)', () => {
    render(<MeasurementDates today="2026-10-14" />);
    expect(screen.getByText('Startmeting')).toBeInTheDocument();
    expect(screen.getByText('1 september 2026')).toBeInTheDocument();
    expect(screen.getByText('Meetdatum')).toBeInTheDocument();
    expect(screen.getByText('31 januari 2027')).toBeInTheDocument();
  });

  it('counts the days left until the meetdatum', () => {
    render(<MeasurementDates today="2026-10-14" />);
    expect(screen.getByText('109 dagen')).toBeInTheDocument();
  });

  it('on the day itself and afterwards it never shows a negative count', () => {
    const { rerender } = render(<MeasurementDates today="2027-01-31" />);
    expect(screen.getByText(/vandaag wordt gemeten/i)).toBeInTheDocument();
    rerender(<MeasurementDates today="2027-02-03" />);
    expect(screen.getByText(/de meting is gedaan/i)).toBeInTheDocument();
  });
});
