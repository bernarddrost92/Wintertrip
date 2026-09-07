import { Calculator, LayoutDashboard, ShieldCheck, Target } from 'lucide-react';
import type { AppView } from '../types/navigation';
import { MissionStatus } from './MissionStatus';

const NAV_ITEMS: { view: AppView; label: string; icon: typeof Calculator }[] = [
  { view: 'calculator', label: 'Mission Calculator', icon: Calculator },
  { view: 'league-check', label: 'League Check', icon: ShieldCheck },
  { view: 'mission-control', label: 'Mission Control', icon: LayoutDashboard },
];

interface NavbarProps {
  current: AppView;
  onNavigate: (view: AppView) => void;
}

export function Navbar({ current, onNavigate }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gold/15 bg-mission-void/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-4">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold/50 bg-mission-raised text-gold">
            <Target size={20} aria-hidden />
          </span>
          <span>
            <span className="block font-display text-sm font-bold tracking-[0.2em] text-ink sm:text-base">
              007 — OPERATION JANUARY
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              Team Zwolle · 01 Sep 2026 – 31 Jan 2027
            </span>
          </span>
        </button>

        <nav aria-label="Hoofdnavigatie" className="flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
            const active = current === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate(view)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 sm:text-sm ${
                  active
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-transparent text-ink-muted hover:border-white/15 hover:text-ink'
                }`}
              >
                <Icon size={15} aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
          <div className="ml-1 hidden lg:block">
            <MissionStatus kind="active" />
          </div>
        </nav>
      </div>
    </header>
  );
}
