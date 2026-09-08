/**
 * The production dashboard is a separate concept from the League: it
 * answers "what did the team actually place, and how much DB does that
 * represent" from Marre's own Excel bookkeeping — not "how many League
 * Points does that earn". Deliberately no field here is ever treated as a
 * scoring-engine input (see services/production.ts) without an explicit,
 * visible mapping decision later.
 */

import type { AgentRole } from './league';

export type DateQuality = 'ok' | 'needs_review';

/**
 * One placement row from the manual Excel snapshot, already stripped of
 * anything identifying (professional name, client name) — see
 * data/production/manualMarreSnapshot.ts for why. `db` is `null` when the
 * snapshot has no figure for that row yet ("DB ontbreekt") — never coerced
 * to 0, since a missing value and a real zero mean very different things
 * for production reporting.
 */
export interface ProductionRecord {
  id: string;
  accountManager: string;
  /** null = no Talentmanager filled in on this row yet. */
  talentManager: string | null;
  db: number | null;
  dateQuality: DateQuality;
}

export interface TeamProductionStats {
  placementCount: number;
  knownDb: number;
  missingDbCount: number;
}

export interface AgentProductionStats {
  code: string;
  role: AgentRole;
  placementCount: number;
  knownDb: number;
  missingDbCount: number;
}

/** The "no Talentmanager filled in yet" bucket — deliberately not shaped
 * like an AgentProductionStats row, so the UI can never mistake it for an
 * actual person on the TM leaderboard. */
export interface UnassignedProductionStats {
  placementCount: number;
  knownDb: number;
}

export interface TmProductionStats {
  agents: AgentProductionStats[];
  unassigned: UnassignedProductionStats;
}

export interface ProductionDataQuality {
  missingTmCount: number;
  missingDbCount: number;
  /** Records flagged by the defensive date check (unparseable or
   * end-before-start). Null when the snapshot's date formats are too
   * inconsistent to count reliably — shown as a qualitative flag rather
   * than a guessed number in that case. */
  dateCheckCount: number | null;
}

export type SyncMode = 'MANUAL_SNAPSHOT' | 'LIVE_SYNCED';

/** Describes where the production data came from, so Mission Control can
 * never present a manual snapshot as if it were a live sync. */
export interface ProductionSourceMeta {
  dataSourceLabel: string;
  syncMode: SyncMode;
  syncLabel: string;
  syncValue: string;
}

/**
 * The seam the future SharePoint/Excel integration plugs into: swap
 * ManualProductionDataSource for an ApiProductionDataSource that fetches
 * from a secure Power Automate / API layer, and Mission Control needs no
 * changes at all — it only ever talks to this interface.
 */
export interface ProductionDataSource {
  getProductionData(): Promise<ProductionRecord[]>;
  getSourceMeta(): ProductionSourceMeta;
}
