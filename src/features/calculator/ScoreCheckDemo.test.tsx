import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionFlowProvider } from '../missionFlow/MissionFlowProvider';
import { ScoreCheckPage } from '../score-check/ScoreCheckPage';
import { DEMO_EXAMPLE } from './scoreCheckDemoSteps';

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: () => false, getSupabaseClient: vi.fn() }));

function renderScoreCheck() {
  return render(
    <MissionFlowProvider>
      <ScoreCheckPage />
    </MissionFlowProvider>,
  );
}

const demo = () => within(screen.getByTestId('demo-coach'));
const fill = () => fireEvent.click(demo().getByRole('button', { name: /vul voor mij in/i }));

describe('Score Check demo', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    Element.prototype.scrollIntoView = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  it('walks through every field, fills in the example and ends on the score', () => {
    renderScoreCheck();
    fireEvent.click(screen.getByRole('button', { name: /demo: help me invullen/i }));
    expect(demo().getByText('Demo · stap 1 van 7')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Kies actie' })).toHaveAttribute('data-demo-focus');

    // Action and deal type are already right: "Volgende".
    fireEvent.click(demo().getByRole('button', { name: /volgende/i }));
    fireEvent.click(demo().getByRole('button', { name: /volgende/i }));

    expect(demo().getByRole('heading', { name: 'Startdatum' })).toBeInTheDocument();
    expect(screen.getByLabelText('Startdatum')).toHaveAttribute('data-demo-focus');
    fill();
    expect(screen.getByLabelText('Startdatum')).toHaveValue(DEMO_EXAMPLE.startDate);
    fill();
    expect(screen.getByLabelText('Einddatum')).toHaveValue(DEMO_EXAMPLE.endDate);
    fill();
    expect(screen.getByLabelText('VCDB per volledige maand')).toHaveValue(Number(DEMO_EXAMPLE.vcdb));

    expect(demo().getByRole('heading', { name: 'Factor' })).toBeInTheDocument();
    expect(demo().getByText(/1,3x \(#10\)/)).toBeInTheDocument();
    fill();
    expect(within(screen.getByRole('radiogroup', { name: 'Factor' })).getByRole('radio', { checked: true })).toHaveTextContent('1,3x');

    expect(demo().getByRole('heading', { name: 'Je score' })).toBeInTheDocument();
    expect(screen.getByText('Jouw score')).toBeInTheDocument();
    expect(document.querySelector('[data-demo="result"]')).toHaveAttribute('data-demo-focus');
    fireEvent.click(demo().getByRole('button', { name: /klaar/i }));
    expect(screen.queryByTestId('demo-coach')).not.toBeInTheDocument();
    expect(document.querySelector('[data-demo-focus]')).toBeNull();
  });

  it('starts from an empty form, and Stop ends it without touching what was entered', () => {
    renderScoreCheck();
    fireEvent.change(screen.getByLabelText('Startdatum'), { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: /demo: help me invullen/i }));
    expect(screen.getByLabelText('Startdatum')).toHaveValue('');
    fireEvent.click(demo().getByRole('button', { name: /volgende/i }));
    fireEvent.click(demo().getByRole('button', { name: /volgende/i }));
    fill();
    fireEvent.click(demo().getByRole('button', { name: /vorige/i }));
    expect(demo().getByText(/ingevuld/i)).toBeInTheDocument();
    fireEvent.click(demo().getByRole('button', { name: /stop demo/i }));
    expect(screen.queryByTestId('demo-coach')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Startdatum')).toHaveValue(DEMO_EXAMPLE.startDate);
  });
});
