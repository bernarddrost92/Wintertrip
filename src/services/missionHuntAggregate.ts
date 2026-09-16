import { normalizeEmail } from '../utils/normalizeEmail';
import { classifyPlacement } from './missionHuntClassification';
import type { MissionHuntPlacement, MissionHuntProfile, PlacementReview, TeamMember } from '../types/missionHunt';

export interface OpportunityCounts {
  total: number;
  /** VERLENGKANS — includes placements that are also DOUBLE. */
  verleng: number;
  /** TIMINGKANS — includes placements that are also DOUBLE. */
  timing: number;
  double: number;
  grey: number;
}

export function countOpportunities(placements: readonly MissionHuntPlacement[]): OpportunityCounts {
  const counts: OpportunityCounts = { total: placements.length, verleng: 0, timing: 0, double: 0, grey: 0 };
  for (const placement of placements) {
    const classification = classifyPlacement(placement.startDate, placement.endDate);
    if (classification.isExtension) counts.verleng += 1;
    if (classification.isTiming) counts.timing += 1;
    if (classification.isDouble) counts.double += 1;
    if (classification.isGrey) counts.grey += 1;
  }
  return counts;
}

export interface AccountManagerSummary {
  emailNormalized: string;
  displayName: string;
  /** A provisioned profile exists for this email — they have signed in at
   * least once. Drives Friday Review's "not yet logged in" status. */
  hasLoggedIn: boolean;
  placements: MissionHuntPlacement[];
  counts: OpportunityCounts;
  /** A current (never stale — the DB trigger deletes it the instant the
   * underlying placement set changes) ALLES KLOPT confirmation exists. */
  isVerified: boolean;
}

/**
 * Groups every placement by its (normalized) owner email — not ownerId,
 * since an unclaimed central-import placement has none yet — unioned with
 * every active team_members row so a person with zero placements still
 * shows up once the roster is populated (team_members is empty today; this
 * is what makes that future-safe rather than requiring a code change).
 */
export function buildAccountManagerSummaries(
  placements: readonly MissionHuntPlacement[],
  profiles: readonly MissionHuntProfile[],
  teamMembers: readonly TeamMember[],
  placementReviews: readonly PlacementReview[],
): AccountManagerSummary[] {
  const profileByEmail = new Map(profiles.map((p) => [p.emailNormalized, p]));
  const reviewedEmails = new Set(placementReviews.map((r) => normalizeEmail(r.userEmail)));

  const placementsByEmail = new Map<string, MissionHuntPlacement[]>();
  const displayNameByEmail = new Map<string, string>();

  for (const placement of placements) {
    const email = normalizeEmail(placement.ownerEmail);
    if (!placementsByEmail.has(email)) placementsByEmail.set(email, []);
    placementsByEmail.get(email)!.push(placement);
    if (placement.ownerDisplayName && !displayNameByEmail.has(email)) displayNameByEmail.set(email, placement.ownerDisplayName);
  }

  for (const member of teamMembers) {
    if (!placementsByEmail.has(member.emailNormalized)) placementsByEmail.set(member.emailNormalized, []);
    if (!displayNameByEmail.has(member.emailNormalized)) displayNameByEmail.set(member.emailNormalized, member.displayName);
  }

  const summaries: AccountManagerSummary[] = [];
  for (const [email, ownPlacements] of placementsByEmail) {
    const profile = profileByEmail.get(email);
    summaries.push({
      emailNormalized: email,
      displayName: profile?.displayName ?? displayNameByEmail.get(email) ?? email,
      hasLoggedIn: profile !== undefined,
      placements: ownPlacements,
      counts: countOpportunities(ownPlacements),
      isVerified: reviewedEmails.has(email),
    });
  }

  return summaries.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export interface TeamCompletion {
  verifiedCount: number;
  totalCount: number;
}

export function teamCompletion(summaries: readonly AccountManagerSummary[]): TeamCompletion {
  return { verifiedCount: summaries.filter((s) => s.isVerified).length, totalCount: summaries.length };
}
