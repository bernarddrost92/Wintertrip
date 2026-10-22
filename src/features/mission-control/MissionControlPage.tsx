import { useMemo, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { DemoCoach } from '../../components/DemoCoach';
import { SoftDivider } from '../../components/SoftDivider';
import { JANUARY_FORECAST } from '../../data/januaryForecast';
import { getMissionSnapshot } from '../../services/missionSnapshot';
import { CommandBriefingCard } from './CommandBriefingCard';
import { IntelligenceStatusSection } from './IntelligenceStatusSection';
import { JanuaryForecastSection } from './JanuaryForecastSection';
import { LeagueCheckReceiptsSection } from './LeagueCheckReceiptsSection';
import { missionControlDemoSteps } from './missionControlDemoSteps';
import { StandingsTable } from './StandingsTable';
import { ZwolleProjectionPanel } from './ZwolleProjectionPanel';

/**
 * Mission Control — the overview. Command Briefing (where Zwolle stands),
 * the full official ranking with a Net FTE lens, Zwolle's official stand
 * next to its projection with the open FTE-bonnen, the League Check receipt
 * totals and the data status. Official and projected figures always sit in
 * separate, labelled blocks.
 */
export function MissionControlPage() {
  const { ranking, fte, powerBi, standings, updatedAt } = getMissionSnapshot();
  const position = ranking.virtualPosition;
  const above = position !== null && position > 1 ? standings.find((row) => row.finalRanking === position - 1) : undefined;
  const [demoIndex, setDemoIndex] = useState<number | null>(null);
  const demoSteps = useMemo(() => missionControlDemoSteps(standings, updatedAt), [standings, updatedAt]);

  return (
    <div className="relative">
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:space-y-7 sm:px-8 sm:py-12">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Mission Control</h1>
            <p className="mt-1 text-base text-ink-muted">Waar staan we?</p>
          </div>
          <button
            type="button"
            onClick={() => setDemoIndex(0)}
            className="inline-flex min-h-11 items-center gap-2 border border-gold/35 px-3.5 text-sm font-medium text-gold transition-colors hover:border-gold/70 hover:bg-gold/[0.06]"
          >
            <PlayCircle size={16} aria-hidden />
            Demo: leg de cijfers uit
          </button>
        </header>
        <CommandBriefingCard
          ranking={ranking}
          powerBi={powerBi}
          fte={fte}
          teamAbove={above ? { team: above.team, position: above.finalRanking, finalScore: above.finalScore } : null}
        />
        {/* Where we stand and who is next first; the full table after. */}
        <ZwolleProjectionPanel standings={standings} />
        <SoftDivider />
        <StandingsTable standings={standings} updatedAt={updatedAt} />
        <LeagueCheckReceiptsSection />
        <JanuaryForecastSection forecast={JANUARY_FORECAST} standings={standings} />
        <IntelligenceStatusSection powerBiUpdatedAt={powerBi.updatedAt} />
      </section>

      {demoIndex !== null && (
        <DemoCoach label="Demo cijfers" steps={demoSteps} ctx={null} index={demoIndex} onIndexChange={setDemoIndex} onStop={() => setDemoIndex(null)} />
      )}
    </div>
  );
}
