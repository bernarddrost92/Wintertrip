import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Wand2, X } from 'lucide-react';

/** One step of a guided demo: which element to light up, what to say and
 * (optionally) how to fill in the example. `C` is whatever the form needs. */
export interface DemoStep<C> {
  key: string;
  title: string;
  text: string;
  selector: string;
  /** Fills in the example value — absent on read-only steps. */
  fill?: (ctx: C) => void;
  done: (ctx: C) => boolean;
}

interface DemoCoachProps<C> {
  /** Accessible name, e.g. "Demo Score Check". */
  label: string;
  steps: DemoStep<C>[];
  ctx: C;
  index: number;
  onIndexChange: (index: number) => void;
  onStop: () => void;
}

/**
 * A guided demo: one step at a time it lights up the field, says what
 * belongs in it and can fill in an example. It only fills a form through
 * that form's own setters (the steps' fill functions) — no logic of its own.
 */
export function DemoCoach<C>({ label, steps, ctx, index, onIndexChange, onStop }: DemoCoachProps<C>) {
  const step = steps[index];
  const done = step.done(ctx);
  const last = index === steps.length - 1;

  // Light up and scroll to this step's field.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(step.selector);
    if (!el) return;
    el.setAttribute('data-demo-focus', '');
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return () => el.removeAttribute('data-demo-focus');
  }, [step.selector, done]);

  function next() {
    if (last) onStop();
    else onIndexChange(index + 1);
  }

  function fillAndNext() {
    step.fill?.(ctx);
    if (!last) onIndexChange(index + 1);
  }

  // Portalled to <body>: the calculator's frame is transformed, which would
  // otherwise pin this "fixed" panel to the frame instead of the screen.
  return createPortal(
    <aside
      role="dialog"
      aria-label={label}
      data-testid="demo-coach"
      className="fixed inset-x-3 bottom-3 z-40 border border-gold/50 bg-mission-deep/95 p-4 shadow-gold-lg backdrop-blur sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-gold">
          Demo · stap {index + 1} van {steps.length}
        </p>
        <button type="button" onClick={onStop} className="inline-flex min-h-9 items-center gap-1 px-2 text-[13px] text-ink-muted hover:text-ink" aria-label="Stop demo">
          <X size={15} aria-hidden /> Stop
        </button>
      </div>
      <div className="mt-2 h-1 bg-white/10" aria-hidden>
        <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>

      <h2 className="mt-3 text-lg font-bold text-ink">{step.title}</h2>
      <p className="mt-1 text-[15px] leading-snug text-ink-muted" aria-live="polite">
        {step.text}
      </p>
      {done && step.fill && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-gold">
          <Check size={14} aria-hidden /> Ingevuld
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {index > 0 && (
          <button type="button" onClick={() => onIndexChange(index - 1)} className="inline-flex min-h-11 items-center gap-1.5 border border-white/10 px-3 text-sm font-medium text-ink-muted hover:border-white/25 hover:text-ink">
            <ArrowLeft size={14} aria-hidden /> Vorige
          </button>
        )}
        {step.fill && !done ? (
          <button type="button" onClick={fillAndNext} className="ml-auto inline-flex min-h-11 items-center gap-2 bg-gold px-4 text-sm font-semibold text-mission-deep hover:bg-gold-bright">
            <Wand2 size={15} aria-hidden /> Vul voor mij in
          </button>
        ) : (
          <button type="button" onClick={next} className="ml-auto inline-flex min-h-11 items-center gap-2 bg-gold px-4 text-sm font-semibold text-mission-deep hover:bg-gold-bright">
            {last ? 'Klaar' : 'Volgende'} {!last && <ArrowRight size={15} aria-hidden />}
          </button>
        )}
      </div>
    </aside>,
    document.body,
  );
}
