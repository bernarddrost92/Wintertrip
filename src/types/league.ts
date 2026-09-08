/**
 * Core domain types for 007 — Operatie Wintersport 2027.
 *
 * Dates are represented as ISO date-only strings ("YYYY-MM-DD"). Keeping dates
 * as plain strings (rather than Date objects) through the data layer avoids
 * timezone-shift bugs; conversion to date-only calendar math happens only
 * inside utils/dates.ts.
 */

export type IsoDate = string;

export type MissionType = 'NEW_PLACEMENT' | 'EXTENSION' | 'HOURS_INCREASE';

/** Business domain of the assignment. W&S never scores within the league. */
export type Domain =
  | 'Onderwijs'
  | 'Zorg'
  | 'ICT'
  | 'Techniek'
  | 'Finance'
  | 'W&S'
  | 'Overig';

/**
 * Two competing interpretations of how the ranking Factor is ultimately
 * applied at the league/dashboard level. Not yet decided internally — kept
 * as a single config switch (see config/leagueRules.ts) so the rule can
 * change without touching UI or calculator code.
 */
export type FactorApplicationMode = 'ALL_VCDB' | 'CONTRACTANT_ONLY';

export interface FactorOption {
  /** Ranking position label, e.g. "#1", "#6 – #10", "Zonder factor". */
  position: string;
  /** Short human label shown in selectors. */
  label: string;
  /** Multiplier applied to the base score. */
  value: number;
}

/**
 * A single placement / extension / hours-increase record, matching the
 * shape the future Power Automate → JSON API is expected to deliver.
 */
export interface Placement {
  id: string;
  professional: string;
  client: string;
  domain: Domain;
  accountManager: string;
  talentManager: string;
  type: MissionType;
  startDate: IsoDate;
  endDate: IsoDate;
  durationMonths: number;
  vcdbPerMonth: number;
  newContractor: boolean;
  oldHours: number;
  newHours: number;
  leagueMonths: number;
  baseScore: number;
  factor: number;
  finalScore: number;
  leagueCheckApproved: boolean;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/** Inclusive date range, e.g. the league period itself. */
export interface DateRange {
  start: IsoDate;
  end: IsoDate;
}

export interface AccountManagerStats {
  name: string;
  newPlacements: number;
  extensions: number;
  hoursIncreases: number;
  baseScore: number;
  factorImpact: number;
  finalScore: number;
}

export interface TalentManagerStats {
  name: string;
  newContractors: number;
  placementsSupported: number;
  baseScore: number;
  factorImpact: number;
  finalScore: number;
}

export interface WeeklyMissionUpdate {
  weekLabel: string;
  pointsThisWeek: number;
  newPlacements: number;
  extensions: number;
  newContractors: number;
  leagueChecks: number;
  biggestDeal: number;
  topContributor: string;
}

export interface WeeklyScorePoint {
  weekLabel: string;
  score: number;
}

export interface TeamSnapshot {
  teamName: string;
  currentPosition: number;
  missionScore: number;
  currentFactor: number;
  contractorPosition: number;
  weeklyGrowth: number;
}

/** Full payload shape the Mission Control dashboard consumes. */
export interface LeagueDataset {
  team: TeamSnapshot;
  accountManagers: AccountManagerStats[];
  talentManagers: TalentManagerStats[];
  weeklyUpdate: WeeklyMissionUpdate;
  weeklyScoreHistory: WeeklyScorePoint[];
  placements: Placement[];
}

export interface LeagueCheckItem {
  id: string;
  /** Short tactical mission code shown above the question, e.g. "01 START DATE". */
  code: string;
  label: string;
}

export interface LeagueCheckState {
  reviewer: string;
  checkDate: IsoDate;
  checkedItems: Record<string, boolean>;
}
