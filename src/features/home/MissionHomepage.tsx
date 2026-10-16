import { Calculator, LayoutDashboard, Radio, TrendingUp } from 'lucide-react';
import { softAssetUrl } from '../../components/softAssets';
import { missionUpdates } from '../../data/missionUpdates';
import type { AppView } from '../../types/navigation';
import { MissionChoiceCard } from './MissionChoiceCard';

interface MissionHomepageProps {
  onSelect: (view: AppView) => void;
}

/**
 * The cinematic mission briefing — a poster, not a form. Deliberately a
 * different register from the calculator's dense control room: big
 * typography sitting directly on the environment, four "mission terminal"
 * choices rather than a settings page, the active mission (Net FTE)
 * visually the largest.
 */
export function MissionHomepage({ onSelect }: MissionHomepageProps) {
  const updateCount = missionUpdates.length;
  const updateBadge = updateCount > 0 ? `${updateCount} UPDATE${updateCount === 1 ? '' : 'S'}` : undefined;

  return (
    <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      {/* The page's one supplied 007 asset: soft viewfinder brackets framing
          the briefing headline — corners only, never over the text, and
          left out on mobile. */}
      <img
        src={softAssetUrl('soft-corner-brackets')}
        alt=""
        aria-hidden
        className="soft-asset left-1/2 top-6 hidden w-[680px] max-w-[92%] -translate-x-1/2 opacity-[0.1] sm:block"
      />

      <p className="label-classified">007 · Mission Briefing</p>

      <h1 className="mt-6 max-w-full break-words font-display text-[9vw] font-black uppercase leading-[0.92] tracking-tight text-ink sm:text-6xl lg:text-7xl">
        Operatie
        <br />
        <span className="bg-gold-sweep bg-clip-text text-transparent">Wintertrip 2027</span>
      </h1>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.5em] text-ink-muted">Team Zwolle</p>

      <div className="mt-14 flex items-center gap-4 sm:mt-16">
        <span className="h-px w-8 bg-gold/40 sm:w-12" aria-hidden />
        <p className="font-display text-4xl font-black uppercase text-gold sm:text-5xl">Missie #1</p>
        <span className="h-px w-8 bg-gold/40 sm:w-12" aria-hidden />
      </div>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-ink sm:text-lg">
        Niet top 3. Niet bijna. <span className="font-semibold text-gold">Wij gaan voor #1.</span>
      </p>

      <div className="mt-14 grid w-full gap-5 sm:mt-16">
        {/* The current team priority is the Net FTE hunt, so Net FTE is the
            hero here; the other operations sit quieter underneath. */}
        <MissionChoiceCard
          code="01"
          eyebrow="Active Mission"
          title="The Net FTE Hunt"
          subtitle={
            <>
              <p>We staan #1 op VCDB.</p>
              <p className="font-semibold text-ink">Nu moeten we die voorsprong verzilveren via Net FTE.</p>
            </>
          }
          cta="Open Net FTE"
          icon={TrendingUp}
          size="lg"
          onClick={() => onSelect('net-fte')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <MissionChoiceCard
            code="02"
            title="Score Check"
            subtitle="Bereken je deal en check direct de league impact."
            cta="Start Score Check"
            icon={Calculator}
            onClick={() => onSelect('score-check')}
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
        <MissionChoiceCard
          code="04"
          title="Mission Updates"
          subtitle="Classified transmissions from Team Zwolle."
          cta="View Archive"
          icon={Radio}
          badge={updateBadge}
          onClick={() => onSelect('mission-updates')}
        />
      </div>
    </div>
  );
}
