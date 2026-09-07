import { Calculator, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { MissionCard } from '../components/MissionCard';
import { RadarBackground } from '../components/RadarBackground';
import type { AppView } from '../types/navigation';

interface HomePageProps {
  onNavigate: (view: AppView) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="relative">
      <section className="relative overflow-hidden border-b border-gold/10 px-4 py-20 sm:px-6 sm:py-28">
        <RadarBackground />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="label-classified animate-rise-in text-gold">Classified · Team Zwolle Only</p>
          <h1 className="mt-4 animate-rise-in font-display text-5xl font-bold uppercase tracking-tight text-ink [animation-delay:80ms] sm:text-7xl">
            007
            <span className="mt-2 block text-gold-gradient bg-[length:200%_auto] animate-gold-sweep-move">
              Operation January
            </span>
          </h1>
          <p className="mt-4 animate-rise-in text-sm font-semibold uppercase tracking-[0.4em] text-ink-muted [animation-delay:140ms]">
            Team Zwolle
          </p>

          <div className="mt-10 flex animate-rise-in items-center justify-center gap-6 [animation-delay:200ms]">
            <div className="h-px w-12 bg-gold/40" />
            <div>
              <p className="label-classified">Missie</p>
              <p className="font-display text-4xl font-bold text-gold sm:text-5xl">#1</p>
            </div>
            <div className="h-px w-12 bg-gold/40" />
          </div>

          <p className="mx-auto mt-8 max-w-xl animate-rise-in text-base font-medium uppercase tracking-wide text-ink [animation-delay:260ms] sm:text-lg">
            Niet top 3. Niet bijna. <span className="text-gold">Wij gaan voor #1.</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <MissionCard
            icon={<Calculator size={20} />}
            title="Mission Calculator"
            description="Bereken direct de waarde van je deal."
            onClick={() => onNavigate('calculator')}
          />
          <MissionCard
            icon={<ShieldCheck size={20} />}
            title="League Check"
            description="2 paar ogen. 0 punten laten liggen."
            onClick={() => onNavigate('league-check')}
          />
          <MissionCard
            icon={<LayoutDashboard size={20} />}
            title="Mission Control"
            description="Bekijk score, bijdrage en voortgang."
            onClick={() => onNavigate('mission-control')}
          />
        </div>
      </section>

      <section className="border-t border-gold/10 px-4 py-12 text-center sm:px-6">
        <p className="font-display text-2xl font-bold uppercase tracking-[0.15em] text-gold-gradient bg-[length:200%_auto] animate-gold-sweep-move sm:text-3xl">
          We gaan voor goud.
        </p>
      </section>
    </div>
  );
}
