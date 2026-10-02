import { getMissionSnapshot } from '../../services/missionSnapshot';
import { CommandBriefingCard } from './CommandBriefingCard';
import { IntelligenceStatusSection } from './IntelligenceStatusSection';
import { LeagueCheckReceiptsSection } from './LeagueCheckReceiptsSection';
import { RoadToJan31Card } from './RoadToJan31Card';
import { ScoreIntelligenceSection } from './ScoreIntelligenceSection';

/**
 * The single 007 Mission Control briefing — Command Briefing, Road to 31
 * Jan, Score Intelligence (Power BI), Mission Receipts (League Check
 * receipt totals) and Intelligence Status. Marre's production feed, which
 * used to drive Base League Points/Team Contribution/sync status, is no
 * longer maintained and has been removed from this page. The earlier mock "Team
 * Zwolle League" dashboard (its own KPI grid, Weekly Mission Update,
 * AM/TM Leaderboards, weekly chart) has been removed entirely — this is
 * now the only dashboard on the page.
 */
export function MissionControlPage() {
  const { ranking, fte, powerBi } = getMissionSnapshot();

  return (
    <div className="relative">
      <section className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
        <CommandBriefingCard ranking={ranking} powerBi={powerBi} fte={fte} />
        <RoadToJan31Card fte={fte} />
        <div className="space-y-6">
          <ScoreIntelligenceSection powerBi={powerBi} currentFteFactor={fte.currentFteFactor ?? null} />
          <LeagueCheckReceiptsSection />
          <IntelligenceStatusSection powerBiUpdatedAt={powerBi.updatedAt} />
        </div>
      </section>
    </div>
  );
}
