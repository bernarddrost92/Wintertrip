/**
 * Pure aggregation over a scored production feed — no React, fully
 * testable in isolation, single source of truth for Mission Control's
 * totals/rankings/data-quality. Every function reads the SAME unique
 * record set (getScoredProductionFeed's output), so AM/TM contribution
 * views can never inflate the Team Zwolle total (see getTeamTotal vs.
 * getAmContribution/getTmContribution).
 */
import type { ScoredProductionRecord } from './productionScoring';

export interface TeamProductionTotal {
  totalBaseLeaguePoints: number;
  qualifyingDeals: number;
  scoringPending: number;
}

export interface AgentContribution {
  code: string;
  score: number;
  deals: number;
}

export interface ProductionDataQuality {
  scoringPendingCount: number;
  scoringMismatchCount: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Total Base League Points + qualifying-deal/pending counts — every
 * unique deal counts exactly once, regardless of how many people it's
 * attributed to below. */
export function getTeamTotal(scored: ScoredProductionRecord[]): TeamProductionTotal {
  let totalBaseLeaguePoints = 0;
  let qualifyingDeals = 0;
  let scoringPending = 0;

  for (const { outcome } of scored) {
    if (outcome.kind === 'excluded') continue;
    if (outcome.kind === 'pending') {
      scoringPending += 1;
      continue;
    }
    totalBaseLeaguePoints += outcome.calculatedLeagueScore;
    if (outcome.eligible) qualifyingDeals += 1;
  }

  return { totalBaseLeaguePoints: round2(totalBaseLeaguePoints), qualifyingDeals, scoringPending };
}

/** Attribution view over the accountManager field. Every scored deal is
 * attributed to its AM (deals with 0-point outcomes — W&S, sub-threshold
 * hours — still count toward that AM's deal tally, just not their score). */
export function getAmContribution(scored: ScoredProductionRecord[]): AgentContribution[] {
  return aggregateByCode(scored, (r) => r.record.accountManager);
}

/** Same as getAmContribution, but only over records with a Talentmanager
 * filled in — an empty TM is a valid, allowed state (a deal placed jointly
 * with another branch), never presented as "Unknown"/"Unassigned"/"Missing"
 * on this leaderboard, it simply isn't attributed to anyone here. */
export function getTmContribution(scored: ScoredProductionRecord[]): AgentContribution[] {
  return aggregateByCode(scored, (r) => r.record.talentManager);
}

function aggregateByCode(scored: ScoredProductionRecord[], codeOf: (r: ScoredProductionRecord) => string | null): AgentContribution[] {
  const byCode = new Map<string, { score: number; deals: number }>();

  for (const entry of scored) {
    if (entry.outcome.kind !== 'scored') continue;
    const code = codeOf(entry);
    if (!code) continue;

    const existing = byCode.get(code) ?? { score: 0, deals: 0 };
    existing.score += entry.outcome.calculatedLeagueScore;
    existing.deals += 1;
    byCode.set(code, existing);
  }

  return Array.from(byCode.entries())
    .map(([code, { score, deals }]) => ({ code, score: round2(score), deals }))
    .sort((a, b) => b.score - a.score);
}

/** SCORING PENDING (records with missing/incomplete required data) and
 * SCORING MISMATCH (a computed score that disagrees with the Sheet's own
 * League score column by more than the tolerance) — never hardcoded,
 * always derived from the current feed. */
export function getProductionDataQuality(scored: ScoredProductionRecord[]): ProductionDataQuality {
  let scoringPendingCount = 0;
  let scoringMismatchCount = 0;

  for (const { outcome } of scored) {
    if (outcome.kind === 'pending') scoringPendingCount += 1;
    if (outcome.kind === 'scored' && outcome.sheetComparison === 'mismatch') scoringMismatchCount += 1;
  }

  return { scoringPendingCount, scoringMismatchCount };
}
