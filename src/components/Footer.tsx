import { useMemo } from 'react';
import { pickOneLiner } from '../data/oneLiners';

export function Footer() {
  const tagline = useMemo(() => pickOneLiner(new Date().getDay()), []);

  return (
    <footer className="border-t border-gold/10 px-4 py-8 text-center sm:px-6">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-ink-muted">{tagline}</p>
      <p className="mt-3 text-[11px] text-ink-muted/70">
        007 — OPERATIE WINTERSPORT 2027 · TEAM ZWOLLE · 01 SEP 2026 – 31 JAN 2027
      </p>
    </footer>
  );
}
