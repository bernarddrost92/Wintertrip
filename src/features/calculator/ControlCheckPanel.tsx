import { AlertTriangle, Check, Radio } from 'lucide-react';
import type { CalculatorOutput } from './useMissionControlCalculator';

interface ControlCheckPanelProps {
  output: CalculatorOutput;
}

const STATUS_CONFIG: Record<CalculatorOutput['readiness'], { text: string; classes: string }> = {
  INPUT_REQUIRED: { text: 'INPUT REQUIRED', classes: 'border-white/15 text-ink-muted' },
  INVALID: { text: 'INVALID MISSION WINDOW', classes: 'border-gold/50 bg-gold/10 text-gold' },
  NOT_ELIGIBLE: { text: 'NOT LEAGUE ELIGIBLE', classes: 'border-gold/50 bg-gold/10 text-gold' },
  READY: { text: '', classes: '' }, // resolved below based on opportunities
};

export function ControlCheckPanel({ output }: ControlCheckPanelProps) {
  const { completeCount, totalCount, isInputComplete, result, opportunities, readiness } = output;
  const leagueEligible = result ? result.leagueExposure.totalExposure > 0 : false;
  const hasWarnings = opportunities.some((s) => s.kind === 'warning');

  let statusText = STATUS_CONFIG[readiness].text;
  let statusClasses = STATUS_CONFIG[readiness].classes;
  if (readiness === 'READY') {
    if (hasWarnings) {
      statusText = 'POINTS LEFT ON THE TABLE';
      statusClasses = 'border-gold/50 bg-gold/10 text-gold';
    } else {
      statusText = 'MAXIMIZED';
      statusClasses = 'border-gold bg-gold/15 text-gold shadow-gold';
    }
  }

  const datesDone = output.completion.find((c) => c.key === 'dates')?.done ?? false;
  const vcdbDone = output.completion.find((c) => c.key === 'vcdb')?.done ?? false;

  const checks = [
    { key: 'dates', label: 'Dates valid', done: datesDone, detail: datesDone ? 'OK' : '—' },
    { key: 'league', label: 'League eligible', done: leagueEligible, detail: leagueEligible ? 'ELIGIBLE' : '—' },
    { key: 'vcdb', label: 'VCDB entered', done: vcdbDone, detail: vcdbDone ? 'OK' : '—' },
    { key: 'factor', label: 'Factor selected', done: true, detail: 'SELECTED' },
  ];

  return (
    <div className="panel relative flex h-full flex-col overflow-hidden">
      <div className="tactical-grid-bg opacity-70" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(circle at 50% 62%, rgba(227,178,60,0.08), transparent 55%)' }}
        aria-hidden
      />
      <header className="relative flex items-center justify-between border-b border-gold/15 bg-mission-panel px-4 py-3">
        <h2 className="label-classified text-ink">Control Check</h2>
        <span className={`font-mono text-[11px] font-semibold tracking-wider ${isInputComplete ? 'text-gold' : 'text-ink-muted'}`}>
          {completeCount} / {totalCount}
        </span>
      </header>

      <ul className="relative space-y-0.5 bg-mission-panel px-4 py-3">
        {checks.map((c) => (
          <li key={c.key} className="flex items-center justify-between py-1 text-xs">
            <span className="flex items-center gap-2">
              <span className={c.done ? 'text-gold' : 'text-ink-dim'} aria-hidden>
                {c.done ? <Check size={13} strokeWidth={3} /> : <span className="font-mono">!</span>}
              </span>
              <span className="text-ink">{c.label}</span>
            </span>
            <span className={`font-mono text-[10px] tracking-wider ${c.done ? 'text-gold' : 'text-ink-muted'}`}>{c.detail}</span>
          </li>
        ))}
      </ul>

      <div className="relative border-t border-gold/15 bg-mission-panel px-4 py-3">
        <p className="label-classified mb-2">Opportunity Scan</p>
        {opportunities.length === 0 ? (
          <p className="text-xs text-ink-muted">Vul de missiegegevens in om kansen te scannen.</p>
        ) : (
          <ul className="space-y-1.5">
            {opportunities.map((s) => (
              <li key={s.key} className="flex items-start gap-2 text-xs">
                {s.kind === 'ok' ? (
                  <Check size={13} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                ) : (
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                )}
                <span className="text-ink-muted">{s.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative mt-auto border-t border-gold/15 bg-mission-panel px-4 py-4">
        <p className="label-classified mb-2">Mission Status</p>
        <span className={`flex items-center justify-center gap-2 border px-3 py-2.5 text-xs font-bold uppercase tracking-[0.16em] ${statusClasses}`}>
          <Radio size={13} aria-hidden />
          {statusText}
        </span>
      </div>
    </div>
  );
}
