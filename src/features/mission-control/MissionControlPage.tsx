import { SoftDivider } from '../../components/SoftDivider';
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
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:space-y-7 sm:px-8 sm:py-12">
        <header>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Mission Control</h1>
          <p className="mt-1 text-base text-ink-muted">Waar staan we?</p>
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
        <IntelligenceStatusSection powerBiUpdatedAt={powerBi.updatedAt} />
      </section>
    </div>
  );
}
