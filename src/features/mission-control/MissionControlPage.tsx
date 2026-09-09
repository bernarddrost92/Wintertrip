import { getMissionSnapshot } from '../../services/missionSnapshot';
import { CommandBriefingCard } from './CommandBriefingCard';
import { ProductionSection } from './ProductionSection';
import { RoadToJan31Card } from './RoadToJan31Card';

/**
 * The single 007 Mission Control briefing — Command Briefing, Road to 31
 * Jan, and the production-feed-driven Score Intelligence/Team
 * Contribution/Intelligence Status sections. The earlier mock "Team
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
        <ProductionSection powerBi={powerBi} currentFteFactor={fte.currentFteFactor ?? null} />
      </section>
    </div>
  );
}
