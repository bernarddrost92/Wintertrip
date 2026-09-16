import { normalizeEmail } from '../utils/normalizeEmail';
import { buildPlacementFingerprint } from './missionHuntFingerprint';
import type { MissionHuntPlacement, MissionHuntProfile, NewPlacementInput, PlacementReview, TeamImportRow, TeamMember } from '../types/missionHunt';

/** Supabase (snake_case, per the SQL migrations) <-> app (camelCase) shape
 * conversion — isolated here so nothing else in the app needs to know the
 * database's column naming. project_name/status/opportunity_types still
 * exist on public.projects (historical columns, left alone per the
 * forward-only migration) but are no longer part of the app's model —
 * classification is derived purely from dates (missionHuntClassification.ts). */

export interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  email_normalized: string;
  role: 'member' | 'admin';
  active: boolean;
  created_at: string;
}

export interface PlacementRow {
  id: string;
  owner_id: string | null;
  owner_email: string;
  owner_display_name: string | null;
  professional_name: string | null;
  client_name: string | null;
  start_date: string | null;
  end_date: string | null;
  hours_per_week: number | null;
  monthly_vcdb: number | null;
  note: string | null;
  fingerprint: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberRow {
  id: string;
  display_name: string;
  email_normalized: string;
  active: boolean;
  created_at: string;
}

export interface PlacementReviewRow {
  id: string;
  user_id: string;
  user_email: string;
  verified_at: string;
  placement_count_at_verification: number;
  created_at: string;
}

export function profileRowToProfile(row: ProfileRow): MissionHuntProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    emailNormalized: row.email_normalized,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function placementRowToPlacement(row: PlacementRow): MissionHuntPlacement {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerEmail: row.owner_email,
    ownerDisplayName: row.owner_display_name,
    professionalName: row.professional_name ?? '',
    clientName: row.client_name ?? '',
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    hoursPerWeek: row.hours_per_week,
    monthlyDb: row.monthly_vcdb,
    note: row.note,
    fingerprint: row.fingerprint,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function teamMemberRowToTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    displayName: row.display_name,
    emailNormalized: row.email_normalized,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function placementReviewRowToPlacementReview(row: PlacementReviewRow): PlacementReview {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    verifiedAt: row.verified_at,
    placementCountAtVerification: row.placement_count_at_verification,
    createdAt: row.created_at,
  };
}

/** Builds the insert row for "+ Plaatsing toevoegen" — the signed-in user
 * is always the owner, both by id and by email. */
export function newPlacementToInsertRow(ownerId: string, ownerEmail: string, ownerDisplayName: string, input: NewPlacementInput) {
  const normalizedEmail = normalizeEmail(ownerEmail);
  return {
    owner_id: ownerId,
    owner_email: normalizedEmail,
    owner_display_name: ownerDisplayName,
    professional_name: input.professionalName,
    client_name: input.clientName,
    start_date: input.startDate,
    end_date: input.endDate,
    hours_per_week: input.hoursPerWeek ?? null,
    monthly_vcdb: input.monthlyDb ?? null,
    note: input.note ?? null,
    fingerprint: buildPlacementFingerprint(normalizedEmail, input.professionalName, input.clientName, input.startDate, input.endDate),
  };
}

/** Builds the insert row for one Team Placement Import row — owner_id is
 * always null (the admin importing it is not the owner; the real owner may
 * not have an auth user yet). */
export function teamImportRowToInsertRow(row: TeamImportRow, fingerprint: string) {
  const normalizedEmail = normalizeEmail(row.ownerEmail);
  return {
    owner_id: null,
    owner_email: normalizedEmail,
    owner_display_name: row.ownerDisplayName,
    professional_name: row.professionalName,
    client_name: row.clientName,
    start_date: row.startDate,
    end_date: row.endDate,
    hours_per_week: row.hoursPerWeek,
    monthly_vcdb: row.monthlyDb,
    fingerprint,
  };
}
