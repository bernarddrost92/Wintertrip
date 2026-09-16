import { normalizeEmail } from '../utils/normalizeEmail';
import type { MissionHuntPlacement, MissionHuntProfile } from '../types/missionHunt';

/**
 * Client-side mirror of the Supabase RLS policies (migration 0006) — used
 * only to decide what the UI offers (an edit control, a delete button). The
 * database is the actual authority: every write still goes through RLS, so
 * this function being wrong would fail closed (a blocked Supabase write),
 * never open.
 *
 * A placement is "mine" either by ownerId (claimed) or, for an unclaimed
 * central-import row, by ownerEmail matching my own signed-in email —
 * exactly what the RLS USING clause allows.
 */
export function canEditPlacement(
  placement: Pick<MissionHuntPlacement, 'ownerId' | 'ownerEmail'>,
  currentUserId: string,
  currentUserEmail: string,
  role: MissionHuntProfile['role'],
): boolean {
  if (role === 'admin') return true;
  if (placement.ownerId === currentUserId) return true;
  return placement.ownerId === null && normalizeEmail(placement.ownerEmail) === normalizeEmail(currentUserEmail);
}

/** Whether a placement currently belongs to (is claimed by or matches the
 * email of) the given person — used to scope "My Placements" without
 * requiring ownerId to already be set. */
export function isOwnPlacement(placement: Pick<MissionHuntPlacement, 'ownerId' | 'ownerEmail'>, currentUserId: string, currentUserEmail: string): boolean {
  if (placement.ownerId === currentUserId) return true;
  return placement.ownerId === null && normalizeEmail(placement.ownerEmail) === normalizeEmail(currentUserEmail);
}
