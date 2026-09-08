import { Lock, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { pickOneLiner } from '../data/oneLiners';

interface FooterProps {
  onReplayIntro: () => void;
  onResetAccess: () => void;
}

export function Footer({ onReplayIntro, onResetAccess }: FooterProps) {
  const tagline = useMemo(() => pickOneLiner(new Date().getDay()), []);

  return (
    <footer className="border-t border-gold/10 px-4 py-8 text-center sm:px-6">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">{tagline}</p>
      <p className="mt-3 text-[11px] text-ink-muted/70">
        007 — OPERATIE WINTERTRIP 2027 · TEAM ZWOLLE · 01 SEP 2026 – 31 JAN 2027
      </p>
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onReplayIntro}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-dim transition-colors duration-150 hover:text-gold"
        >
          <RotateCcw size={11} aria-hidden />
          Replay Intro
        </button>
        <span className="h-3 w-px bg-white/10" aria-hidden />
        <button
          type="button"
          onClick={onResetAccess}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-dim transition-colors duration-150 hover:text-gold"
        >
          <Lock size={11} aria-hidden />
          Reset Access
        </button>
      </div>
    </footer>
  );
}
