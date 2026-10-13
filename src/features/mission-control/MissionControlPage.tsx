import { getMissionSnapshot } from '../../services/missionSnapshot';
import { CommandBriefingCard } from './CommandBriefingCard';
import { IntelligenceStatusSection } from './IntelligenceStatusSection';
import { LeagueCheckReceiptsSection } from './LeagueCheckReceiptsSection';
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

  return (
    <div className="relative">
      <section className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6 sm:py-10">
        <header>
          <p className="label-classified">007 · Mission Control</p>
          <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Mission Control</h1>
        </header>
        <CommandBriefingCard
          ranking={ranking}
          powerBi={powerBi}
          fte={fte}
          teamAbove={above ? { team: above.team, position: above.finalRanking, finalScore: above.finalScore } : null}
        />
        <StandingsTable standings={standings} updatedAt={updatedAt} />
        <ZwolleProjectionPanel standings={standings} />
        <LeagueCheckReceiptsSection />
        <IntelligenceStatusSection powerBiUpdatedAt={powerBi.updatedAt} />
      </section>
    </div>
  );
}
