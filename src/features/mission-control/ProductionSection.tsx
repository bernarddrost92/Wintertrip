import { getAmContribution, getProductionDataQuality, getTeamTotal, getTmContribution } from '../../services/productionAggregate';
import { scoreProductionFeed } from '../../services/productionScoring';
import { ProductionContributionSection } from './ProductionContributionSection';
import { ProductionDataQualitySection } from './ProductionDataQualitySection';
import { ProductionHeroSection } from './ProductionHeroSection';
import { useProductionFeed } from './useProductionFeed';

/**
 * The production dashboard — Marre's Google Sheet, sanitized (see
 * types/productionFeed.ts: no professional/client name ever reaches this
 * component), scored through the same central scoring engine the
 * Calculator uses, and never presented as live when it isn't (mock/
 * degraded states are always visible in the hero). Mobile order matches
 * the DOM order below: Total Base League Points -> AM Contribution -> TM
 * Contribution -> Data Quality.
 */
export function ProductionSection() {
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
      <ProductionHeroSection
        team={team}
        mock={feed.mock}
        degraded={feed.degraded}
        fetchedAt={feed.fetchedAt}
        refreshing={refreshing}
        onRefresh={refresh}
      />
      <ProductionContributionSection role="AM" agents={amContribution} />
      <ProductionContributionSection role="TM" agents={tmContribution} />
      <ProductionDataQualitySection quality={dataQuality} />
    </div>
  );
}
