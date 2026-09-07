import { Calculator, LayoutDashboard, ShieldCheck, Target } from 'lucide-react';
import type { AppView } from '../types/navigation';
import { StatusLed } from './MissionSerial';

const NAV_ITEMS: { view: AppView; label: string; icon: typeof Calculator }[] = [
  { view: 'calculator', label: 'Calculator', icon: Calculator },
  { view: 'league-check', label: 'League Check', icon: ShieldCheck },
  { view: 'mission-control', label: 'Mission Control', icon: LayoutDashboard },
];

interface NavbarProps {
  current: AppView;
  onNavigate: (view: AppView) => void;
}

export function Navbar({ current, onNavigate }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gold/15 bg-mission-void/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <button type="button" onClick={() => onNavigate('calculator')} className="flex min-w-0 items-center gap-2.5 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/50 bg-mission-raised text-gold">
            <Target size={16} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-xs font-bold leading-none tracking-[0.1em] text-ink sm:text-sm sm:tracking-[0.16em]">
              007 — OPERATION JANUARY
            </span>
            <span className="mt-0.5 hidden text-[10px] font-medium uppercase leading-none tracking-[0.25em] text-gold/80 sm:block">
              Team Zwolle · 01 Sep – 31 Jan
            </span>
          </span>
        </button>

        <nav aria-label="Hoofdnavigatie" className="flex items-center gap-1">
          {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
            const active = current === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate(view)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 sm:text-xs ${
                  active
                    ? 'border-gold/50 bg-gold/10 text-gold'
                    : 'border-transparent text-ink-muted hover:border-white/15 hover:text-ink'
                }`}
              >
                <Icon size={13} aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
          <span className="ml-2 hidden items-center gap-1.5 border border-gold/25 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80 lg:flex">
            <StatusLed tone="go" />
            Live
          </span>
        </nav>
      </div>
    </header>
  );
}
