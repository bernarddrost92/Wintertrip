/**
 * Fully fictional demo dataset for Mission Control (V1).
 *
 * No real client names, professional names, or team member names appear
 * here — this file is safe to commit to a public repository. Once the
 * SharePoint → Power Automate → JSON pipeline exists, services/api.ts swaps
 * this module out for a live fetch without any UI changes required.
 */
import { calculateExtensionScore, calculateHoursIncreaseScore, calculateNewPlacementScore } from '../services/scoring';
import type {
  AccountManagerStats,
  LeagueDataset,
  Placement,
  TalentManagerStats,
  TeamSnapshot,
  WeeklyMissionUpdate,
  WeeklyScorePoint,
} from '../types/league';
import type { DealCategory } from '../types/scoring';

const ACCOUNT_MANAGERS = ['Agent Aurum', 'Agent Falcon', 'Agent Vega', 'Agent Orion'] as const;
const TALENT_MANAGERS = ['Agent Solstice', 'Agent Meridian', 'Agent Cassini', 'Agent Nova'] as const;

interface MockPlacementInput {
  id: string;
  professional: string;
  client: string;
  domain: Placement['domain'];
  accountManager: (typeof ACCOUNT_MANAGERS)[number];
  talentManager: (typeof TALENT_MANAGERS)[number];
  type: Placement['type'];
  startDate: string;
  endDate: string;
  vcdbPerMonth: number;
  factor: number;
  newContractor: boolean;
  oldHours?: number;
  newHours?: number;
  /** For EXTENSION rows: the end date the contract had *before* this extension. */
  previousEndDate?: string;
  leagueCheckApproved: boolean;
  createdAt: string;
}

function buildPlacement(input: MockPlacementInput): Placement {
  // W&S is modelled as a domain in the mock dataset (pre-dating the calculator's
  // own Deal Category field); map it onto the same league-eligibility gate.
  const dealCategory: DealCategory = input.domain === 'W&S' ? 'WS' : 'DETACHERING';

  const result =
    input.type === 'EXTENSION' && input.previousEndDate
      ? calculateExtensionScore(input.previousEndDate, input.endDate, input.vcdbPerMonth, input.factor, input.createdAt, dealCategory)
      : input.type === 'HOURS_INCREASE'
        ? calculateHoursIncreaseScore(input.oldHours ?? 0, input.newHours ?? 0, input.startDate, input.endDate, input.vcdbPerMonth, input.factor, dealCategory)
        : calculateNewPlacementScore(input.startDate, input.endDate, input.vcdbPerMonth, input.factor, dealCategory);

  const { baseScore, finalScore, qualifyingTerm, leagueExposure } = result;
  // Legacy dashboard summary fields: effective whole-month equivalents,
  // derived from the exact proration result rather than re-approximated.
  const durationMonths = input.vcdbPerMonth > 0 ? Math.round((qualifyingTerm.totalValue / input.vcdbPerMonth) * 10) / 10 : 0;
  const leagueMonths = Math.round(leagueExposure.totalExposure * 100) / 100;

  return {
    id: input.id,
    professional: input.professional,
    client: input.client,
    domain: input.domain,
    accountManager: input.accountManager,
    talentManager: input.talentManager,
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    durationMonths,
    vcdbPerMonth: input.vcdbPerMonth,
    newContractor: input.newContractor,
    oldHours: input.oldHours ?? 0,
    newHours: input.newHours ?? 0,
    leagueMonths,
    baseScore,
    factor: input.factor,
    finalScore,
    leagueCheckApproved: input.leagueCheckApproved,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

const RAW_PLACEMENTS: MockPlacementInput[] = [
  { id: 'op-001', professional: 'Professional 01', client: 'Noorderpoort Groep', domain: 'Onderwijs', accountManager: 'Agent Aurum', talentManager: 'Agent Solstice', type: 'NEW_PLACEMENT', startDate: '2026-09-01', endDate: '2027-04-30', vcdbPerMonth: 10, factor: 2.5, newContractor: true, leagueCheckApproved: true, createdAt: '2026-09-02' },
  { id: 'op-002', professional: 'Professional 02', client: 'Zorggroep Vecht', domain: 'Zorg', accountManager: 'Agent Aurum', talentManager: 'Agent Cassini', type: 'NEW_PLACEMENT', startDate: '2026-09-15', endDate: '2027-03-15', vcdbPerMonth: 8, factor: 2.5, newContractor: true, leagueCheckApproved: true, createdAt: '2026-09-16' },
  { id: 'op-003', professional: 'Professional 03', client: 'IJssel ICT Services', domain: 'ICT', accountManager: 'Agent Aurum', talentManager: 'Agent Solstice', type: 'EXTENSION', startDate: '2026-09-01', endDate: '2027-05-31', previousEndDate: '2026-12-31', vcdbPerMonth: 9, factor: 2.5, newContractor: false, leagueCheckApproved: true, createdAt: '2026-11-20' },
  { id: 'op-004', professional: 'Professional 04', client: 'Salland Techniek', domain: 'Techniek', accountManager: 'Agent Falcon', talentManager: 'Agent Meridian', type: 'NEW_PLACEMENT', startDate: '2026-10-01', endDate: '2027-06-30', vcdbPerMonth: 9, factor: 2.0, newContractor: true, leagueCheckApproved: true, createdAt: '2026-10-02' },
  { id: 'op-005', professional: 'Professional 05', client: 'Twentse Financials', domain: 'Finance', accountManager: 'Agent Falcon', talentManager: 'Agent Nova', type: 'HOURS_INCREASE', startDate: '2026-09-01', endDate: '2027-01-31', vcdbPerMonth: 4, factor: 2.0, newContractor: false, oldHours: 24, newHours: 32, leagueCheckApproved: true, createdAt: '2026-09-10' },
  { id: 'op-006', professional: 'Professional 06', client: 'Overijssel Onderwijs Alliantie', domain: 'Onderwijs', accountManager: 'Agent Falcon', talentManager: 'Agent Meridian', type: 'NEW_PLACEMENT', startDate: '2026-11-01', endDate: '2027-07-31', vcdbPerMonth: 7, factor: 2.0, newContractor: true, leagueCheckApproved: false, createdAt: '2026-11-03' },
  { id: 'op-007', professional: 'Professional 07', client: 'Regio Zorgpartners', domain: 'Zorg', accountManager: 'Agent Vega', talentManager: 'Agent Cassini', type: 'NEW_PLACEMENT', startDate: '2026-09-01', endDate: '2027-02-28', vcdbPerMonth: 6, factor: 1.7, newContractor: true, leagueCheckApproved: true, createdAt: '2026-09-05' },
  { id: 'op-008', professional: 'Professional 08', client: 'Deventer Data Groep', domain: 'ICT', accountManager: 'Agent Vega', talentManager: 'Agent Solstice', type: 'EXTENSION', startDate: '2026-09-01', endDate: '2027-03-31', previousEndDate: '2027-01-15', vcdbPerMonth: 8, factor: 1.7, newContractor: false, leagueCheckApproved: true, createdAt: '2026-12-18' },
  { id: 'op-009', professional: 'Professional 09', client: 'Kampen Bouw & Techniek', domain: 'Techniek', accountManager: 'Agent Vega', talentManager: 'Agent Nova', type: 'NEW_PLACEMENT', startDate: '2026-12-01', endDate: '2027-06-30', vcdbPerMonth: 6, factor: 1.7, newContractor: true, leagueCheckApproved: false, createdAt: '2026-12-02' },
  { id: 'op-010', professional: 'Professional 10', client: 'Vechtdal Finance Groep', domain: 'Finance', accountManager: 'Agent Orion', talentManager: 'Agent Meridian', type: 'NEW_PLACEMENT', startDate: '2026-09-01', endDate: '2027-01-31', vcdbPerMonth: 5, factor: 1.5, newContractor: true, leagueCheckApproved: true, createdAt: '2026-09-08' },
  { id: 'op-011', professional: 'Professional 11', client: 'Stedendriehoek Onderwijs', domain: 'Onderwijs', accountManager: 'Agent Orion', talentManager: 'Agent Cassini', type: 'HOURS_INCREASE', startDate: '2026-10-01', endDate: '2027-01-31', vcdbPerMonth: 3, factor: 1.5, newContractor: false, oldHours: 20, newHours: 24, leagueCheckApproved: true, createdAt: '2026-10-05' },
  { id: 'op-012', professional: 'Professional 12', client: 'Groenlo Recruitment', domain: 'W&S', accountManager: 'Agent Orion', talentManager: 'Agent Nova', type: 'NEW_PLACEMENT', startDate: '2026-09-01', endDate: '2027-01-31', vcdbPerMonth: 6, factor: 1.5, newContractor: true, leagueCheckApproved: false, createdAt: '2026-09-12' },
];

export const MOCK_PLACEMENTS: Placement[] = RAW_PLACEMENTS.map(buildPlacement);

function aggregateAccountManagers(placements: Placement[]): AccountManagerStats[] {
  return ACCOUNT_MANAGERS.map((name) => {
    const rows = placements.filter((p) => p.accountManager === name && p.domain !== 'W&S');
    return {
      name,
      newPlacements: rows.filter((p) => p.type === 'NEW_PLACEMENT').length,
      extensions: rows.filter((p) => p.type === 'EXTENSION').length,
      hoursIncreases: rows.filter((p) => p.type === 'HOURS_INCREASE').length,
      baseScore: rows.reduce((sum, p) => sum + p.baseScore, 0),
      factorImpact: rows.reduce((sum, p) => sum + (p.finalScore - p.baseScore), 0),
      finalScore: rows.reduce((sum, p) => sum + p.finalScore, 0),
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

function aggregateTalentManagers(placements: Placement[]): TalentManagerStats[] {
  return TALENT_MANAGERS.map((name) => {
    const rows = placements.filter((p) => p.talentManager === name && p.domain !== 'W&S');
    return {
      name,
      newContractors: rows.filter((p) => p.newContractor).length,
      placementsSupported: rows.length,
      baseScore: rows.reduce((sum, p) => sum + p.baseScore, 0),
      factorImpact: rows.reduce((sum, p) => sum + (p.finalScore - p.baseScore), 0),
      finalScore: rows.reduce((sum, p) => sum + p.finalScore, 0),
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

export const MOCK_ACCOUNT_MANAGERS = aggregateAccountManagers(MOCK_PLACEMENTS);
export const MOCK_TALENT_MANAGERS = aggregateTalentManagers(MOCK_PLACEMENTS);

const missionScore = MOCK_ACCOUNT_MANAGERS.reduce((sum, am) => sum + am.finalScore, 0);

export const MOCK_TEAM_SNAPSHOT: TeamSnapshot = {
  teamName: 'TEAM ZWOLLE',
  currentPosition: 1,
  missionScore,
  currentFactor: 2.5,
  contractorPosition: 1,
  weeklyGrowth: 1840,
};

export const MOCK_WEEKLY_UPDATE: WeeklyMissionUpdate = {
  weekLabel: 'Week 37',
  pointsThisWeek: 1840,
  newPlacements: 4,
  extensions: 6,
  newContractors: 3,
  leagueChecks: 9,
  biggestDeal: 1000,
  topContributor: 'Agent Aurum',
};

export const MOCK_WEEKLY_SCORE_HISTORY: WeeklyScorePoint[] = [
  { weekLabel: 'Wk 36', score: 9200 },
  { weekLabel: 'Wk 37', score: 11050 },
  { weekLabel: 'Wk 38', score: 12760 },
  { weekLabel: 'Wk 39', score: 14310 },
  { weekLabel: 'Wk 40', score: missionScore },
];

export const MOCK_LEAGUE_DATASET: LeagueDataset = {
  team: MOCK_TEAM_SNAPSHOT,
  accountManagers: MOCK_ACCOUNT_MANAGERS,
  talentManagers: MOCK_TALENT_MANAGERS,
  weeklyUpdate: MOCK_WEEKLY_UPDATE,
  weeklyScoreHistory: MOCK_WEEKLY_SCORE_HISTORY,
  placements: MOCK_PLACEMENTS,
};
