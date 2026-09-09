import { getAmContribution, getProductionDataQuality, getTeamTotal, getTmContribution } from '../../services/productionAggregate';
import { scoreProductionFeed } from '../../services/productionScoring';
import { IntelligenceStatusSection } from './IntelligenceStatusSection';
import { ScoreIntelligenceSection } from './ScoreIntelligenceSection';
import { TeamContributionSection } from './TeamContributionSection';
import { useProductionFeed } from './useProductionFeed';
import type { PowerBiIntelligenceSnapshot } from '../../types/missionSnapshot';

interface ProductionSectionProps {
  powerBi: PowerBiIntelligenceSnapshot;
  currentFteFactor: number | null;
}

/**
 * The production-feed-driven part of Mission Control — Marre's Google
 * Sheet, sanitized (see types/productionFeed.ts: no professional/client
 * name ever reaches this component), scored through the same central
 * scoring engine the Calculator uses, and never presented as live when it
 * isn't (mock/degraded states surface in Score Intelligence and
 * Intelligence Status). powerBi/currentFteFactor are passed through purely
 * for display alongside Base League Points — this component still owns
 * all production-feed fetching/scoring, unchanged from before.
 */
export function ProductionSection({ powerBi, currentFteFactor }: ProductionSectionProps) {
  const { feed, loading, refreshing, refresh } = useProductionFeed();

  if (loading || !feed) {
    return (
      <div className="panel flex items-center justify-center px-6 py-16">
        <p className="label-classified animate-pulse-glow">Loading production feed…</p>
      </div>
    );
  }

  const scored = scoreProductionFeed(feed.records);
  const team = getTeamTotal(scored);
  const amContribution = getAmContribution(scored);
  const tmContribution = getTmContribution(scored);
  const dataQuality = getProductionDataQuality(scored);

  return (
    <div className="space-y-6">
      <ScoreIntelligenceSection team={team} mock={feed.mock} degraded={feed.degraded} powerBi={powerBi} currentFteFactor={currentFteFactor} />
      <TeamContributionSection am={amContribution} tm={tmContribution} />
      <IntelligenceStatusSection
        fetchedAt={feed.fetchedAt}
        degraded={feed.degraded}
        refreshing={refreshing}
        onRefresh={refresh}
        powerBiUpdatedAt={powerBi.updatedAt}
        dataQuality={dataQuality}
      />
    </div>
  );
}
