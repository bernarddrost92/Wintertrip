import { Calculator, LayoutDashboard, ShieldCheck } from 'lucide-react';
import type { AppView } from '../../types/navigation';
import { MissionChoiceCard } from './MissionChoiceCard';

interface MissionHomepageProps {
  onSelect: (view: AppView) => void;
}

/**
 * The cinematic mission briefing — a poster, not a form. Deliberately a
 * different register from the calculator's dense control room: big
 * typography sitting directly on the environment, three "mission terminal"
 * choices rather than a settings page, calculator visually the largest.
 */
export function MissionHomepage({ onSelect }: MissionHomepageProps) {
  return (
    <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{ background: 'radial-gradient(60% 55% at 50% 30%, rgba(3,4,5,0.6), transparent 72%)' }}
        aria-hidden
      />

      <p className="label-classified text-gold/70">007 · Mission Briefing</p>

      <h1 className="mt-5 max-w-full break-words font-display text-[9vw] font-black uppercase leading-[0.92] tracking-tight text-ink sm:text-6xl lg:text-7xl">
        Operatie
        <br />
        <span className="bg-gold-sweep bg-[length:200%_auto] bg-clip-text text-transparent animate-gold-sweep-move">Wintersport 2027</span>
      </h1>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.5em] text-gold/80">Team Zwolle</p>

      <div className="mt-12 flex items-center gap-4 sm:mt-14">
        <span className="h-px w-8 bg-gold/40 sm:w-12" aria-hidden />
        <p className="font-display text-4xl font-black uppercase text-gold sm:text-5xl">Missie #1</p>
        <span className="h-px w-8 bg-gold/40 sm:w-12" aria-hidden />
      </div>
      <p className="mt-4 max-w-lg text-sm font-semibold uppercase leading-relaxed tracking-[0.06em] text-ink sm:text-base">
        Niet top 3. Niet bijna. <span className="text-gold">Wij gaan voor #1.</span>
      </p>

      <div className="mt-16 grid w-full gap-4 sm:mt-20">
        <MissionChoiceCard
          code="01"
          title="Mission Calculator"
          subtitle="Bereken wat je deal oplevert."
          cta="Calculate"
          icon={Calculator}
          size="lg"
          onClick={() => onSelect('calculator')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <MissionChoiceCard
            code="02"
            title="League Check"
            subtitle="2 paar ogen. 0 punten laten liggen."
            cta="Run Check"
            icon={ShieldCheck}
            onClick={() => onSelect('league-check')}
          />
          <MissionChoiceCard
            code="03"
            title="Mission Control"
            subtitle="Bekijk de stand en intelligence."
            cta="Open Control"
            icon={LayoutDashboard}
            onClick={() => onSelect('mission-control')}
          />
        </div>
      </div>
    </div>
  );
}
