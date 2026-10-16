import { useState } from 'react';
import { ArrowLeft, Calculator, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { CommandFrame } from '../../components/CommandFrame';
import { MissionControlCalculator } from '../calculator/MissionControlCalculator';
import { LeagueCheckPage } from '../league-check/LeagueCheckPage';
import { useMissionFlow } from '../missionFlow/missionFlowContext';

type Step = 1 | 2;

const STEPS: { step: Step; title: string; sub: string; icon: typeof Calculator }[] = [
  { step: 1, title: 'Bereken score-impact', sub: 'Calculator', icon: Calculator },
  { step: 2, title: 'Bekijk league impact', sub: 'League Check', icon: ShieldCheck },
];

function scrollToTop() {
  if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Score Check — the Calculator and League Check as one tool. Step 1 is the
 * existing Mission Calculator; "Door naar League Check" freezes its form +
 * result as the BEFORE CHECK snapshot (Mission Flow context) and moves to
 * step 2, the existing League Check, which picks that snapshot up — no
 * re-entering anything. The calculator stays mounted while step 2 is open,
 * so "Terug naar berekening" returns to exactly the same inputs;
 * "Nieuwe berekening" (or League Check's own NEW MISSION) clears both.
 */
export function ScoreCheckPage() {
  const { beforeCheck, clearBeforeCheck, resetAgent } = useMissionFlow();
  const [step, setStep] = useState<Step>(1);
  const [runKey, setRunKey] = useState(0);
  const [checkOpened, setCheckOpened] = useState(false);

  function goTo(next: Step) {
    setStep(next);
    if (next === 2) setCheckOpened(true);
    scrollToTop();
  }

  function startNewCalculation() {
    clearBeforeCheck();
    resetAgent();
    setRunKey((k) => k + 1);
    setCheckOpened(false);
    goTo(1);
  }

  return (
    <div>
      <div className="mx-auto max-w-[1240px] px-3 pt-6 sm:px-6 sm:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-classified">007 · Score Check</p>
            <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Score Check</h1>
          </div>
          {step === 2 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => goTo(1)}
                className="inline-flex items-center gap-1.5 border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-white/25 hover:text-ink"
              >
                <ArrowLeft size={13} aria-hidden />
                Terug naar berekening
              </button>
              <button
                type="button"
                onClick={startNewCalculation}
                className="inline-flex items-center gap-1.5 border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-white/25 hover:text-ink"
              >
                <RotateCcw size={13} aria-hidden />
                Nieuwe berekening
              </button>
            </div>
          )}
        </div>

        <ol aria-label="Score Check stappen" className="mt-5 grid grid-cols-2 gap-px border border-white/[0.07] bg-white/[0.05]">
          {STEPS.map(({ step: s, title, sub, icon: Icon }) => {
            const active = step === s;
            const done = s === 1 && beforeCheck !== null && step === 2;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => goTo(s)}
                  aria-current={active ? 'step' : undefined}
                  className={`relative flex h-full w-full items-center gap-3 px-3 py-3.5 text-left transition-colors sm:px-5 ${
                    active ? 'bg-mission-raised/80' : 'bg-mission-panel/80 hover:bg-mission-soft'
                  }`}
                >
                  {active && <span className="absolute inset-x-0 top-0 h-px bg-gold" aria-hidden />}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center border font-display text-sm font-bold ${
                      active ? 'border-gold/70 text-gold' : done ? 'border-gold/40 text-gold/80' : 'border-white/15 text-ink-dim'
                    }`}
                    aria-hidden
                  >
                    {done ? <Check size={15} /> : s}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-sm font-semibold uppercase tracking-wide ${active ? 'text-ink' : 'text-ink-dim'}`}>
                      Stap {s} · {title}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-ink-dim">
                      <Icon size={11} aria-hidden />
                      {sub}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Both steps stay mounted (just hidden) once opened, so switching
          back and forth keeps every input and every ticked check. */}
      <div hidden={step !== 1}>
        <MissionControlCalculator key={`calc-${runKey}`} onRunLeagueCheck={() => goTo(2)} />
      </div>

      {checkOpened && (
        <div hidden={step !== 2}>
          <CommandFrame>
            <LeagueCheckPage key={`check-${runKey}`} onNewMission={startNewCalculation} />
          </CommandFrame>
        </div>
      )}
    </div>
  );
}
