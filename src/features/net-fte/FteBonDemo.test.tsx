import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HUNT_TEST_STANDINGS } from '../hunt/huntTestStandings';
import { FTE_BON_DEMO_EXAMPLE } from './fteBonDemoSteps';
import { FteBonCalculator } from './FteBonCalculator';

function renderCalculator() {
  const onSave = vi.fn().mockResolvedValue(null);
  render(<FteBonCalculator standings={HUNT_TEST_STANDINGS} openFte={0} storeStatus="ready" saving={false} onSave={onSave} onPrintReceipt={vi.fn()} />);
  return { onSave };
}

const demo = () => within(screen.getByTestId('demo-coach'));
const fill = () => fireEvent.click(demo().getByRole('button', { name: /vul voor mij in/i }));
const next = () => fireEvent.click(demo().getByRole('button', { name: /volgende/i }));

describe('FTE Bon demo', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('walks through the bon, shows the live effect and the next target, and never saves', () => {
    const { onSave } = renderCalculator();
    fireEvent.click(screen.getByRole('button', { name: /demo: help me invullen/i }));
    expect(demo().getByText('Demo · stap 1 van 6')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Type actie' })).toHaveAttribute('data-demo-focus');

    fill();
    expect(screen.getByRole('radio', { name: 'PO → contract' })).toHaveAttribute('aria-checked', 'true');
    fill();
    expect(screen.getByLabelText(/groei in fte/i)).toHaveValue(FTE_BON_DEMO_EXAMPLE.fte);

    expect(demo().getByRole('heading', { name: 'Het effect' })).toBeInTheDocument();
    expect(demo().getByText(/#9 Utrecht\) is \+0,19 FTE nodig/)).toBeInTheDocument();
    expect(document.querySelector('[data-demo="fte-effect"]')).toHaveAttribute('data-demo-focus');
    next();

    fill();
    expect(screen.getByLabelText(/naam \/ label/i)).toHaveValue(FTE_BON_DEMO_EXAMPLE.label);
    fill();
    expect(screen.getByLabelText(/talent manager/i)).toHaveValue(FTE_BON_DEMO_EXAMPLE.owner);

    expect(demo().getByRole('heading', { name: 'Pak FTE-bon' })).toBeInTheDocument();
    const save = screen.getByRole('button', { name: /pak fte-bon/i });
    expect(save).toBeDisabled();
    fireEvent.submit(save.closest('form')!);
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(demo().getByRole('button', { name: /klaar/i }));
    expect(screen.queryByTestId('demo-coach')).not.toBeInTheDocument();
    // The example is cleared, so it can't be saved by accident afterwards.
    expect(screen.getByLabelText(/groei in fte/i)).toHaveValue('');
    expect(screen.getByLabelText(/naam \/ label/i)).toHaveValue('');
    expect(screen.getByLabelText(/talent manager/i)).toHaveValue('');
  });

  it('Stop ends the demo and clears the example', () => {
    renderCalculator();
    fireEvent.click(screen.getByRole('button', { name: /demo: help me invullen/i }));
    fill();
    fill();
    fireEvent.click(demo().getByRole('button', { name: /stop demo/i }));
    expect(screen.queryByTestId('demo-coach')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/groei in fte/i)).toHaveValue('');
  });
});
