/** Mission Control demo: a guided tour of the figures, with the live numbers. */
import type { DemoStep } from '../../components/DemoCoach';
import { NET_FTE_FACTOR_LADDER, BASE_NET_FTE_FACTOR } from '../../config/leagueRules';
import { OWN_TEAM, type PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import { nextFinalRankingTarget, nextNetFteTarget, projectStandings } from '../../services/netFteProjection';
import { formatFactor, formatSignedFte, formatVcdbValue } from '../../utils/format';
import { formatPowerBiTime } from '../../utils/snapshotTime';

/** Read-only tour: nothing to fill, every step is "done". */
type TourStep = DemoStep<null>;

function ladderLine(): string {
  const tiers = NET_FTE_FACTOR_LADDER.map((t) => `${t.fromRank === t.toRank ? `#${t.fromRank}` : `#${t.fromRank}–${t.toRank}`} ${formatFactor(t.factor)}`);
  return `${tiers.join(' · ')} · daarna ${formatFactor(BASE_NET_FTE_FACTOR)}`;
}

/** Every number comes from the official standings (no open bonnen). */
export function missionControlDemoSteps(standings: PowerBiStandingRow[], updatedAt: string): TourStep[] {
  const projection = projectStandings(standings, OWN_TEAM, 0);
  const own = projection.own.official;
  const leader = [...standings].sort((a, b) => a.finalRanking - b.finalRanking)[0];
  const above = nextFinalRankingTarget(standings, OWN_TEAM, 0);
  const fteTarget = nextNetFteTarget(projection);
  const step = (key: string, title: string, text: string, selector: string): TourStep => ({ key, title, text, selector, done: () => true });

  const atTop = own.finalRanking === 1;
  return [
    step(
      'position',
      'Onze positie',
      `We staan #${own.finalRanking} in de eindstand. Dit is de officiële stand uit Power BI van ${formatPowerBiTime(updatedAt)}; die telt.`,
      '[data-demo="mc-position"]',
    ),
    step(
      'final',
      'Final Score',
      `De Final Score is VCDB × factor: ${formatVcdbValue(own.vcdbScore)} × ${formatFactor(own.factor)} = ${formatVcdbValue(own.finalScore)}. Wie op 31 januari de hoogste Final Score heeft, wint.`,
      '[data-demo="mc-final"]',
    ),
    step(
      'strip',
      'Waar het verschil zit',
      atTop
        ? `We staan bovenaan. VCDB #${own.vcdbRanking}, Net FTE #${own.netFteRanking}, factor ${formatFactor(own.factor)}.`
        : `We staan ${formatVcdbValue(leader.finalScore - own.finalScore)} punten achter op ${leader.team}. In VCDB zijn we #${own.vcdbRanking}, maar in Net FTE #${own.netFteRanking}: daardoor maar factor ${formatFactor(own.factor)}. ${leader.vcdbScore < own.vcdbScore ? `${leader.team} heeft minder VCDB (${formatVcdbValue(leader.vcdbScore)}), maar factor ${formatFactor(leader.factor)}.` : `${leader.team} heeft factor ${formatFactor(leader.factor)}.`}`,
      '[data-demo="mc-strip"]',
    ),
    step(
      'columns',
      'Officieel en projectie',
      'Links de officiële stand uit Power BI. Rechts in blauw de projectie: wat er gebeurt als alle open FTE-bonnen doorgaan. Blauw is dus nog niet binnen.',
      '[data-demo="mc-columns"]',
    ),
    step(
      'targets',
      'De routes omhoog',
      above
        ? `Naar #${above.finalRanking} ${above.team}: ${above.fteRoute ? `${formatSignedFte(above.fteRoute.fteNeeded)} FTE (factor ${formatFactor(above.fteRoute.factor)}) of ` : ''}+${formatVcdbValue(above.vcdbNeeded)} VCDB extra bij ${formatFactor(own.factor)}.${fteTarget ? ` De eerste stap: ${formatSignedFte(fteTarget.fteNeeded)} FTE om #${fteTarget.rank} ${fteTarget.team} te passeren.` : ''}`
        : 'We staan #1. Hier zie je wat er nodig is om die plek vast te houden.',
      '[data-demo="mc-targets"]',
    ),
    step(
      'table',
      'De eindstand',
      `Alle teams met VCDB, Net FTE, FTE-rang, factor en Final Score; onze rij is goud. De factor hangt af van de Net FTE-rang: ${ladderLine()}.`,
      'tr[aria-current="true"]',
    ),
    step(
      'conclusion',
      'De conclusie',
      atTop
        ? 'VCDB en factor zitten goed. Vasthouden: elke move vastleggen als FTE-bon.'
        : `VCDB hebben we al. Het verschil maken we met Net FTE: BPT + VD, PO telt niet mee.${above?.fteRoute ? ` Met ${formatSignedFte(above.fteRoute.fteNeeded)} FTE staan we bovenaan.` : ''} Elke move vastleggen als FTE-bon.`,
      '[data-demo="mc-briefing"]',
    ),
  ];
}
