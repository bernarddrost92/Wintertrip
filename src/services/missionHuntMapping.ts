import type { MissionHuntProfile, MissionHuntProject, NewProjectInput, OpportunityType, ProjectStatus } from '../types/missionHunt';

/** Supabase (snake_case, per the SQL migration) <-> app (camelCase) shape
 * conversion — isolated here so nothing else in the app needs to know the
 * database's column naming. */

export interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  role: 'member' | 'admin';
  active: boolean;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  owner_id: string;
  project_name: string;
  client_name: string;
  professional_name: string | null;
  start_date: string | null;
  end_date: string | null;
  hours_per_week: number | null;
  monthly_vcdb: number | null;
  note: string | null;
  status: ProjectStatus;
  opportunity_types: OpportunityType[] | null;
  fingerprint: string;
  created_at: string;
  updated_at: string;
}

export function profileRowToProfile(row: ProfileRow): MissionHuntProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function projectRowToProject(row: ProjectRow): MissionHuntProject {
  return {
    id: row.id,
    ownerId: row.owner_id,
    projectName: row.project_name,
    clientName: row.client_name,
    professionalName: row.professional_name,
    startDate: row.start_date,
    endDate: row.end_date,
    hoursPerWeek: row.hours_per_week,
    monthlyVcdb: row.monthly_vcdb,
    note: row.note,
    status: row.status,
    opportunityTypes: row.opportunity_types ?? [],
    fingerprint: row.fingerprint,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function newProjectToInsertRow(ownerId: string, input: NewProjectInput, fingerprint: string) {
  return {
    owner_id: ownerId,
    project_name: input.projectName,
    client_name: input.clientName,
    professional_name: input.professionalName ?? null,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    hours_per_week: input.hoursPerWeek ?? null,
    monthly_vcdb: input.monthlyVcdb ?? null,
    note: input.note ?? null,
    status: 'unreviewed' as ProjectStatus,
    opportunity_types: [] as OpportunityType[],
    fingerprint,
  };
}
