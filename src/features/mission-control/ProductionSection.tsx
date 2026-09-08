import { getAmProduction, getProductionDataQuality, getTeamProduction, getTmProduction } from '../../services/production';
import { ProductionContributionSection } from './ProductionContributionSection';
import { ProductionDataQualitySection } from './ProductionDataQualitySection';
import { ProductionHeroSection } from './ProductionHeroSection';
import { useProductionData } from './useProductionData';

/**
 * The production snapshot dashboard — Marre's manual Excel data, clearly
 * marked as such (never as a live SharePoint sync). Placements/DB come
 * from getTeamProduction() over the unique record set; the AM/TM sections
 * below are contribution views over that same set, not additional
 * placements, so nothing here double-counts.
 */
export function ProductionSection() {
  const { records, loading, sourceMeta } = useProductionData();

  if (loading || !records) {
    return (
      <div className="panel flex items-center justify-center px-6 py-16">
        <p className="label-classified animate-pulse-glow">Loading production snapshot…</p>
      </div>
    );
  }

  const team = getTeamProduction(records);
  const amProduction = getAmProduction(records);
  const tmProduction = getTmProduction(records);
  const dataQuality = getProductionDataQuality(records);

  return (
    <div className="space-y-6">
      <ProductionHeroSection team={team} sourceMeta={sourceMeta} />
      <ProductionContributionSection role="AM" agents={amProduction} />
      <ProductionContributionSection role="TM" agents={tmProduction.agents} unassigned={tmProduction.unassigned} />
      <ProductionDataQualitySection quality={dataQuality} />
    </div>
  );
}
