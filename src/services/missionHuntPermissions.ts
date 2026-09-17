import { normalizeEmail } from '../utils/normalizeEmail';
import type { MissionHuntPlacement } from '../types/missionHunt';

/**
 * Every selected team member may edit every placement — Mission Hunt is an
 * internal salesgame for a trusted team, not a system that restricts
 * write access by identity (see migration 0009). Roles remain purely
 * informational (which tab a person lands on by default), never an
 * authorization boundary.
 *
 * This function still exists only for "My Placements" grouping — whether a
 * placement is claimed by (ownerId) or, for an unclaimed central-import
 * row, matches the email of the currently selected person.
 */
export function isOwnPlacement(placement: Pick<MissionHuntPlacement, 'ownerId' | 'ownerEmail'>, currentUserId: string, currentUserEmail: string): boolean {
  if (placement.ownerId === currentUserId) return true;
  return placement.ownerId === null && normalizeEmail(placement.ownerEmail) === normalizeEmail(currentUserEmail);
}
