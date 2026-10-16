import { Calculator, Home, LayoutDashboard, Radio, Target, TrendingUp } from 'lucide-react';
import type { AppView } from '../types/navigation';
import { StatusLed } from './MissionSerial';
import { SoundtrackControl } from './SoundtrackControl';

const NAV_ITEMS: { view: AppView; label: string; icon: typeof Calculator }[] = [
  { view: 'home', label: 'Mission Home', icon: Home },
  { view: 'score-check', label: 'Score Check', icon: Calculator },
  { view: 'net-fte', label: 'Net FTE', icon: TrendingUp },
  { view: 'mission-control', label: 'Mission Control', icon: LayoutDashboard },
  { view: 'mission-updates', label: 'Mission Updates', icon: Radio },
];

interface NavbarProps {
  current: AppView;
  onNavigate: (view: AppView) => void;
}

/** A control-room status bar, not a website nav: identity, league window and
 * mission status read as one continuous instrument strip, with navigation
 * folded in as its rightmost segment rather than the header's main act. */
export function Navbar({ current, onNavigate }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-mission-void/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] items-stretch px-4 sm:px-6">
        <button type="button" onClick={() => onNavigate('home')} className="flex min-w-0 items-center gap-2.5 py-2.5 pr-4 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/30 bg-mission-panel text-gold">
            <Target size={16} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-xs font-bold leading-none tracking-[0.1em] text-ink sm:text-sm sm:tracking-[0.14em]">
              007 <span className="text-gold/40">/</span> OPERATIE WINTERTRIP 2027
            </span>
            <span className="mt-0.5 hidden text-[10px] font-semibold uppercase leading-none tracking-[0.3em] text-ink-muted sm:block">
              Team Zwolle
            </span>
          </span>
        </button>

        <div className="hidden items-center gap-6 border-l border-white/[0.07] px-5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted 2xl:flex">
          <span>
            League window <span className="text-ink">01 sep — 31 jan</span>
          </span>
          <span className="flex items-center gap-1.5">
            <StatusLed tone="go" pulse={false} />
            Mission status active
          </span>
        </div>

        <div className="ml-auto flex items-stretch">
          <SoundtrackControl />

          <nav aria-label="Hoofdnavigatie" className="flex items-stretch gap-0.5 self-stretch border-l border-white/[0.07] pl-2 sm:pl-3">
            {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
              const active = current === view;
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => onNavigate(view)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
                    active ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon size={13} className={active ? 'text-gold' : ''} aria-hidden />
                  <span className="hidden md:inline">{label}</span>
                  {active && <span className="absolute inset-x-2.5 -bottom-px h-px bg-gold" aria-hidden />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
