import { normalizeEmail } from '../utils/normalizeEmail';
import type { MissionHuntPlacement, MissionHuntProfile } from '../types/missionHunt';

/**
 * Roles with the same OPERATIONAL write scope as admin over placements,
 * central import, and Talent Manager assignments — but never over roles
 * or security (see migration 0008: profiles' own write policy, and
 * team_member_roles'/team_members' write policies, stay literally
 * role='admin', completely untouched by the broadened project/TM-link
 * policies these roles share). Mirrors the RLS EXISTS check exactly.
 */
const FULL_ACCESS_ROLES: ReadonlySet<MissionHuntProfile['role']> = new Set(['admin', 'manager', 'office_manager']);

/**
 * Client-side mirror of the Supabase RLS policies (migrations 0006/0008) —
 * used only to decide what the UI offers (an edit control, a delete
 * button). The database is the actual authority: every write still goes
 * through RLS, so this function being wrong would fail closed (a blocked
 * Supabase write), never open.
 *
 * A placement is "mine" either by ownerId (claimed) or, for an unclaimed
 * central-import row, by ownerEmail matching my own signed-in email —
 * exactly what the RLS USING clause allows. admin/manager/office_manager
 * may edit any placement, matching their broadened RLS policy; hr and a
 * plain member never get that bypass.
 */
export function canEditPlacement(
  placement: Pick<MissionHuntPlacement, 'ownerId' | 'ownerEmail'>,
  currentUserId: string,
  currentUserEmail: string,
  role: MissionHuntProfile['role'],
): boolean {
  if (canManageAllPlacements(role)) return true;
  if (placement.ownerId === currentUserId) return true;
  return placement.ownerId === null && normalizeEmail(placement.ownerEmail) === normalizeEmail(currentUserEmail);
}

/** admin/manager/office_manager — full operational write scope over every
 * placement, central import, and Talent Manager assignment. Never role
 * administration (see the module-level comment above). */
export function canManageAllPlacements(role: MissionHuntProfile['role']): boolean {
  return FULL_ACCESS_ROLES.has(role);
}

/** admin/manager/office_manager/hr — everyone with a reason to see the
 * Friday Review / Team Zwolle overview. hr's access is read-only (never
 * wired to any write control); a plain member (AM/TM) still doesn't get
 * this tab at all, matching the existing "current team-view design". */
export function canViewTeamOverview(role: MissionHuntProfile['role']): boolean {
  return canManageAllPlacements(role) || role === 'hr';
}

/** Whether a placement currently belongs to (is claimed by or matches the
 * email of) the given person — used to scope "My Placements" without
 * requiring ownerId to already be set. */
export function isOwnPlacement(placement: Pick<MissionHuntPlacement, 'ownerId' | 'ownerEmail'>, currentUserId: string, currentUserEmail: string): boolean {
  if (placement.ownerId === currentUserId) return true;
  return placement.ownerId === null && normalizeEmail(placement.ownerEmail) === normalizeEmail(currentUserEmail);
}

/**
 * Talent Manager assignment is limited to the full-access roles, mirroring
 * migration 0008's broadened "a full-access role may manage
 * placement_talent_managers" RLS policy — no AM/TM self-service path
 * exists. Used purely to decide whether the UI offers the assignment
 * checkboxes; the database enforces this regardless.
 */
export function canManageTalentManagerAssignments(role: MissionHuntProfile['role']): boolean {
  return canManageAllPlacements(role);
}
