import { AlertTriangle, Check } from 'lucide-react';
import type { CalculatorOutput } from './useMissionControlCalculator';

interface ControlCheckPanelProps {
  output: CalculatorOutput;
}

/**
 * Shown only once the input is complete (progressive disclosure): did we
 * get every point out of this deal? One status line plus the opportunity
 * signals from useMissionControlCalculator — no duplicate of the form's own
 * checklist.
 */
export function ControlCheckPanel({ output }: ControlCheckPanelProps) {
  const { opportunities, readiness } = output;
  const hasWarnings = opportunities.some((s) => s.kind === 'warning');

  const status =
    readiness === 'INVALID'
      ? { text: 'Controleer de datums', good: false }
      : readiness === 'NOT_ELIGIBLE'
        ? { text: 'Telt niet mee', good: false }
        : hasWarnings
          ? { text: 'Hier liggen nog punten', good: false }
          : { text: 'Alles eruit gehaald', good: true };

  return (
    <div className="panel flex h-full flex-col">
      <div className="px-4 py-4 sm:px-5">
        <p className="form-label">Check</p>
        <p
          className={`mt-2 flex items-center gap-2 border px-3 py-2.5 text-[15px] font-semibold ${
            status.good ? 'border-gold/60 bg-gold/10 text-gold' : 'border-gold/40 bg-gold/[0.06] text-gold'
          }`}
          role="status"
        >
          {status.good ? <Check size={16} aria-hidden /> : <AlertTriangle size={16} aria-hidden />}
          {status.text}
        </p>
      </div>

      {opportunities.length > 0 && (
        <div className="border-t border-white/[0.07] px-4 py-4 sm:px-5">
          <p className="form-label mb-2">Kansen</p>
          <ul className="space-y-2">
            {opportunities.map((s) => (
              <li key={s.key} className="flex items-start gap-2 text-sm leading-snug">
                {s.kind === 'ok' ? (
                  <Check size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                ) : (
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                )}
                <span className="text-ink-muted">{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
