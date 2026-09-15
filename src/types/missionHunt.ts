export type ProjectStatus = 'unreviewed' | 'opportunity' | 'investigate' | 'no_action';

export const PROJECT_STATUSES: ProjectStatus[] = ['unreviewed', 'opportunity', 'investigate', 'no_action'];

export type OpportunityType =
  | 'earlier_start'
  | 'extend'
  | 'plus_four_hours'
  | 'more_vcdb'
  | 'keep_fte'
  | 'add_fte'
  | 'other';

export const OPPORTUNITY_TYPES: OpportunityType[] = [
  'earlier_start',
  'extend',
  'plus_four_hours',
  'more_vcdb',
  'keep_fte',
  'add_fte',
  'other',
];

export interface MissionHuntProfile {
  id: string;
  userId: string;
  displayName: string;
  role: 'member' | 'admin';
  active: boolean;
  createdAt: string;
}

export interface MissionHuntProject {
  id: string;
  ownerId: string;
  projectName: string;
  clientName: string;
  professionalName: string | null;
  startDate: string | null;
  endDate: string | null;
  hoursPerWeek: number | null;
  monthlyVcdb: number | null;
  note: string | null;
  status: ProjectStatus;
  opportunityTypes: OpportunityType[];
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields a user actually fills in — everything the app derives (id,
 * ownerId, fingerprint, status default, timestamps) is computed elsewhere. */
export interface NewProjectInput {
  projectName: string;
  clientName: string;
  professionalName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  hoursPerWeek?: number | null;
  monthlyVcdb?: number | null;
  note?: string | null;
}
