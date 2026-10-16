import { BASE_NET_FTE_FACTOR, NET_FTE_FACTOR_LADDER } from '../config/leagueRules';
import type { PowerBiStandingRow } from '../data/manualPowerBiSnapshot';

/**
 * Net FTE projections on top of the official Power BI standings — "what
 * happens to the ranking, the factor and the Final Score if Zwolle's Net
 * FTE changes by X". Pure functions only: the official standings are never
 * mutated, and a projection of 0 FTE always returns the official table.
 *
 * The Net FTE ranking can contain teams that are missing from the Final
 * Ranking table (since 8 Oct, rank #6 belongs to a team not shown). Their
 * Net FTE is unknown, so a hidden team is treated conservatively as being
 * level with the visible team directly above it: Zwolle only passes it by
 * passing that team too.
 */

/** The smallest step that strictly passes another team — "+1,49 nodig" rather than "+1,48 = gelijk". */
const PASS_MARGIN = 0.01;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function factorForNetFteRank(rank: number): number {
  return NET_FTE_FACTOR_LADDER.find((tier) => rank >= tier.fromRank && rank <= tier.toRank)?.factor ?? BASE_NET_FTE_FACTOR;
}

/** Net FTE ranks that belong to a team not in the Final Ranking table. */
export function hiddenNetFteRanks(standings: PowerBiStandingRow[]): number[] {
  const ranks = new Set(standings.map((row) => row.netFteRanking));
  const max = Math.max(0, ...ranks);
  const hidden: number[] = [];
  for (let rank = 1; rank <= max; rank++) if (!ranks.has(rank)) hidden.push(rank);
  return hidden;
}

export interface ProjectedTeam {
  team: string;
  vcdbScore: number;
  netFte: number;
  netFteRanking: number;
  factor: number;
  finalScore: number;
  finalRanking: number;
  official: PowerBiStandingRow;
}

export interface StandingsProjection {
  fteDelta: number;
  /** Every visible team, sorted by projected Final Ranking. */
  teams: ProjectedTeam[];
  own: ProjectedTeam;
  /** The full Net FTE order, hidden teams included (team null). */
  netFteOrder: { rank: number; team: string | null; netFte: number | null }[];
  hiddenRanks: number[];
}

function asProjected(row: PowerBiStandingRow): ProjectedTeam {
  return {
    team: row.team,
    vcdbScore: row.vcdbScore,
    netFte: row.netFte,
    netFteRanking: row.netFteRanking,
    factor: row.factor,
    finalScore: row.finalScore,
    finalRanking: row.finalRanking,
    official: row,
  };
}

/**
 * Re-ranks the Net FTE table with ownTeam's Net FTE moved by fteDelta,
 * reassigns every visible team's factor from its new rank, and re-sorts the
 * Final Ranking. Teams whose factor does not change keep their official
 * Final Score exactly (no rounding drift).
 */
export function projectStandings(standings: PowerBiStandingRow[], ownTeam: string, fteDelta: number): StandingsProjection {
  const ownRow = standings.find((row) => row.team === ownTeam);
  if (!ownRow) throw new Error(`${ownTeam} is not in the standings`);

  const hiddenRanks = hiddenNetFteRanks(standings);
  const delta = round2(fteDelta);
  const projectedNetFte = round2(ownRow.netFte + delta);

  type Slot = { team: string | null; netFte: number | null; row: PowerBiStandingRow | null };
  const officialOrder: Slot[] = [
    ...standings.map((row) => ({ team: row.team, netFte: row.netFte, row, rank: row.netFteRanking })),
    ...hiddenRanks.map((rank) => ({ team: null, netFte: null, row: null, rank })),
  ]
    .sort((a, b) => a.rank - b.rank)
    .map(({ team, netFte, row }) => ({ team, netFte, row }));

  let order: Slot[] = officialOrder;
  if (delta !== 0) {
    const others = officialOrder.filter((slot) => slot.team !== ownTeam);
    // Hidden slots are never passed on their own — see the module comment.
    let insertAt = others.findIndex((slot) => slot.netFte !== null && projectedNetFte > slot.netFte);
    if (insertAt === -1) insertAt = others.length;
    order = [...others.slice(0, insertAt), { team: ownTeam, netFte: projectedNetFte, row: ownRow }, ...others.slice(insertAt)];
  }

  const projected: ProjectedTeam[] = [];
  order.forEach((slot, index) => {
    if (!slot.row) return;
    const rank = index + 1;
    const row = slot.row;
    const factor = factorForNetFteRank(rank);
    // Same factor = same Final Score: keep the official figure exactly.
    const unchanged = factor === row.factor;
    projected.push({
      ...asProjected(row),
      netFte: row.team === ownTeam ? projectedNetFte : row.netFte,
      netFteRanking: rank,
      factor: unchanged ? row.factor : factor,
      finalScore: unchanged ? row.finalScore : round2(row.vcdbScore * factor),
    });
  });

  const teams = projected
    .sort((a, b) => b.finalScore - a.finalScore || a.official.finalRanking - b.official.finalRanking)
    .map((team, index) => ({ ...team, finalRanking: index + 1 }));

  return {
    fteDelta: delta,
    teams,
    own: teams.find((team) => team.team === ownTeam)!,
    netFteOrder: order.map((slot, index) => ({ rank: index + 1, team: slot.team, netFte: slot.team === ownTeam ? projectedNetFte : slot.netFte })),
    hiddenRanks,
  };
}

export interface NetFteTarget {
  /** The Net FTE rank Zwolle gets by passing this team. */
  rank: number;
  team: string;
  netFte: number;
  /** FTE still needed to strictly pass this team, from the projection's own Net FTE. */
  fteNeeded: number;
}

/** The nearest visible team above ownTeam in the Net FTE ranking — null at #1. */
export function nextNetFteTarget(projection: StandingsProjection): NetFteTarget | null {
  const ownIndex = projection.netFteOrder.findIndex((slot) => slot.team === projection.own.team);
  for (let i = ownIndex - 1; i >= 0; i--) {
    const slot = projection.netFteOrder[i];
    if (slot.team !== null && slot.netFte !== null) {
      return { rank: slot.rank, team: slot.team, netFte: slot.netFte, fteNeeded: round2(slot.netFte - projection.own.netFte + PASS_MARGIN) };
    }
  }
  return null;
}

/** Every visible team above ownTeam in the Net FTE ranking, nearest first
 * (the first one is nextNetFteTarget) — empty at #1. Hidden ranks are skipped. */
export function netFteTargetsAbove(projection: StandingsProjection): NetFteTarget[] {
  const ownIndex = projection.netFteOrder.findIndex((slot) => slot.team === projection.own.team);
  const targets: NetFteTarget[] = [];
  for (let i = ownIndex - 1; i >= 0; i--) {
    const slot = projection.netFteOrder[i];
    if (slot.team !== null && slot.netFte !== null) {
      targets.push({ rank: slot.rank, team: slot.team, netFte: slot.netFte, fteNeeded: round2(slot.netFte - projection.own.netFte + PASS_MARGIN) });
    }
  }
  return targets;
}

/** Teams ownTeam has passed in the Net FTE ranking compared to the official table. */
export function teamsPassedInNetFte(projection: StandingsProjection): string[] {
  const ownOfficialRank = projection.own.official.netFteRanking;
  return projection.teams
    .filter((t) => t.team !== projection.own.team && t.official.netFteRanking < ownOfficialRank && t.netFteRanking > projection.own.netFteRanking)
    .sort((a, b) => a.official.netFteRanking - b.official.netFteRanking)
    .map((t) => t.team);
}

export interface FactorStep {
  factor: number;
  /** The worst Net FTE rank that still earns this factor. */
  rank: number;
  /** The visible team that has to be passed to reach that rank. */
  team: string;
  /** Total FTE needed on top of the projection's own Net FTE. */
  fteNeeded: number;
  /** Zwolle's Final Score / position once there. */
  finalScore: number;
  finalRanking: number;
}

/**
 * Every factor tier above ownTeam's current factor, with the FTE needed to
 * reach it and what that does to the Final Ranking. Built on
 * projectStandings, so each step accounts for teams being pushed down.
 */
export function factorSteps(standings: PowerBiStandingRow[], ownTeam: string, baseDelta: number): FactorStep[] {
  const base = projectStandings(standings, ownTeam, baseDelta);
  const steps: FactorStep[] = [];
  for (const tier of [...NET_FTE_FACTOR_LADDER].reverse()) {
    if (tier.factor <= base.own.factor) continue;
    // Zwolle reaches rank toRank by passing whoever holds it now; a hidden
    // slot counts as the visible team directly above it.
    const blocker = [...base.netFteOrder]
      .filter((slot) => slot.rank <= tier.toRank && slot.team !== null && slot.netFte !== null && slot.team !== ownTeam)
      .pop();
    if (!blocker || blocker.netFte === null || blocker.team === null) continue;
    const fteNeeded = round2(blocker.netFte - base.own.netFte + PASS_MARGIN);
    const reached = projectStandings(standings, ownTeam, round2(baseDelta + fteNeeded));
    steps.push({
      factor: reached.own.factor,
      rank: reached.own.netFteRanking,
      team: blocker.team,
      fteNeeded,
      finalScore: reached.own.finalScore,
      finalRanking: reached.own.finalRanking,
    });
  }
  return steps;
}

export interface FinalRankingTarget {
  team: string;
  finalRanking: number;
  finalScore: number;
  /** Points behind that team in the projection. */
  pointsBehind: number;
  /** Extra VCDB needed at the current factor to pass it. */
  vcdbNeeded: number;
  /** Smallest Net FTE step (on top of the projection) that alone passes it, if any. */
  fteRoute: FactorStep | null;
}

/** The team directly above ownTeam in the projected Final Ranking, and two ways to pass it. */
export function nextFinalRankingTarget(standings: PowerBiStandingRow[], ownTeam: string, baseDelta: number): FinalRankingTarget | null {
  const base = projectStandings(standings, ownTeam, baseDelta);
  const above = base.teams.find((t) => t.finalRanking === base.own.finalRanking - 1);
  if (!above) return null;
  const pointsBehind = round2(above.finalScore - base.own.finalScore);
  const vcdbNeeded = round2(above.finalScore / base.own.factor - base.own.vcdbScore + PASS_MARGIN);
  const fteRoute = factorSteps(standings, ownTeam, baseDelta).find((step) => step.finalRanking < base.own.finalRanking) ?? null;
  return { team: above.team, finalRanking: above.finalRanking, finalScore: above.finalScore, pointsBehind, vcdbNeeded, fteRoute };
}
