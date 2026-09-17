import { normalizeEmail } from '../utils/normalizeEmail';
import { classifyPlacement } from './missionHuntClassification';
import type { MissionHuntPlacement, MissionHuntProfile, PlacementReview, TalentManagerLink, TalentManagerReview, TeamMember } from '../types/missionHunt';

export interface OpportunityCounts {
  total: number;
  /** VERLENGKANS — includes placements that are also DOUBLE. */
  verleng: number;
  /** TIMINGKANS — includes placements that are also DOUBLE. */
  timing: number;
  double: number;
  /** URENKANS — FTE < 0.8, additive with any of the above; never
   * double-counted since this is computed once per unique placement, same
   * as every other bucket here. */
  urenkans: number;
  grey: number;
}

export function countOpportunities(placements: readonly MissionHuntPlacement[]): OpportunityCounts {
  const counts: OpportunityCounts = { total: placements.length, verleng: 0, timing: 0, double: 0, urenkans: 0, grey: 0 };
  for (const placement of placements) {
    const classification = classifyPlacement(placement.startDate, placement.endDate, placement.hoursPerWeek);
    if (classification.isExtension) counts.verleng += 1;
    if (classification.isTiming) counts.timing += 1;
    if (classification.isDouble) counts.double += 1;
    if (classification.isUrenkans) counts.urenkans += 1;
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

export interface TalentManagerAccountManagerGroup {
  emailNormalized: string;
  displayName: string;
  placements: MissionHuntPlacement[];
  counts: OpportunityCounts;
}

export interface TalentManagerSummary {
  emailNormalized: string;
  displayName: string;
  /** A provisioned profile exists for this email — they have signed in at
   * least once. */
  hasLoggedIn: boolean;
  /** Unique placements linked to this TM — never duplicated even though a
   * placement may also be linked to other TMs. */
  placements: MissionHuntPlacement[];
  counts: OpportunityCounts;
  /** The same linked placements, grouped by their Accountmanager — for the
   * "grouped by AM" drilldown / cross-pollination view. */
  accountManagers: TalentManagerAccountManagerGroup[];
  isVerified: boolean;
}

/**
 * Groups the UNIQUE set of placements linked to each Talent Manager via
 * placement_talent_managers (migration 0007) — a placement linked to the
 * same TM through only one relation row (the unique index on
 * project_id+email guarantees that), so no de-duplication step is needed
 * beyond simply collecting by project_id. Only people with at least one
 * actual link appear here — unlike buildAccountManagerSummaries this does
 * NOT union in the full team_members roster, since team_members carries no
 * role information yet and every teamMember is not automatically a TM.
 */
export function buildTalentManagerSummaries(
  placements: readonly MissionHuntPlacement[],
  talentManagerLinks: readonly TalentManagerLink[],
  profiles: readonly MissionHuntProfile[],
  talentManagerReviews: readonly TalentManagerReview[],
): TalentManagerSummary[] {
  const placementById = new Map(placements.map((p) => [p.id, p]));
  const profileByEmail = new Map(profiles.map((p) => [p.emailNormalized, p]));
  const reviewedEmails = new Set(talentManagerReviews.map((r) => normalizeEmail(r.userEmail)));

  // tmEmail -> unique placements (a Map keyed by placement id de-duplicates
  // defensively even if the caller ever passes overlapping link rows).
  const placementsByTm = new Map<string, Map<string, MissionHuntPlacement>>();
  const displayNameByTm = new Map<string, string>();

  for (const link of talentManagerLinks) {
    const email = normalizeEmail(link.talentManagerEmail);
    const placement = placementById.get(link.projectId);
    if (!placement) continue; // stale link for a deleted placement — ignore.
    if (!placementsByTm.has(email)) placementsByTm.set(email, new Map());
    placementsByTm.get(email)!.set(placement.id, placement);
    if (link.talentManagerDisplayName && !displayNameByTm.has(email)) displayNameByTm.set(email, link.talentManagerDisplayName);
  }

  const summaries: TalentManagerSummary[] = [];
  for (const [email, placementMap] of placementsByTm) {
    const linkedPlacements = [...placementMap.values()];
    const profile = profileByEmail.get(email);

    const byAm = new Map<string, { displayName: string; placements: MissionHuntPlacement[] }>();
    for (const placement of linkedPlacements) {
      const amEmail = normalizeEmail(placement.ownerEmail);
      if (!byAm.has(amEmail)) {
        const amProfile = profileByEmail.get(amEmail);
        byAm.set(amEmail, { displayName: amProfile?.displayName ?? placement.ownerDisplayName ?? amEmail, placements: [] });
      }
      byAm.get(amEmail)!.placements.push(placement);
    }

    const accountManagers: TalentManagerAccountManagerGroup[] = [...byAm.entries()]
      .map(([amEmail, group]) => ({ emailNormalized: amEmail, displayName: group.displayName, placements: group.placements, counts: countOpportunities(group.placements) }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    summaries.push({
      emailNormalized: email,
      displayName: profile?.displayName ?? displayNameByTm.get(email) ?? email,
      hasLoggedIn: profile !== undefined,
      placements: linkedPlacements,
      counts: countOpportunities(linkedPlacements),
      accountManagers,
      isVerified: reviewedEmails.has(email),
    });
  }

  return summaries.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export interface CrossIntelligenceEntry {
  accountManagerEmail: string;
  accountManagerDisplayName: string;
  talentManagerEmail: string;
  talentManagerDisplayName: string;
  placements: MissionHuntPlacement[];
  counts: OpportunityCounts;
}

/**
 * The AM x TM insight matrix ("BERNARD x KIM: 4 gezamenlijke plaatsingen, 2
 * kansen") — one entry per (AM, TM) pair that shares at least one real
 * placement, derived purely from actual ownership + linkage, never inventing
 * or double-scoring anything.
 */
export function buildCrossIntelligence(
  placements: readonly MissionHuntPlacement[],
  talentManagerLinks: readonly TalentManagerLink[],
  profiles: readonly MissionHuntProfile[],
): CrossIntelligenceEntry[] {
  const placementById = new Map(placements.map((p) => [p.id, p]));
  const profileByEmail = new Map(profiles.map((p) => [p.emailNormalized, p]));
  const displayNameByTm = new Map<string, string>();
  for (const link of talentManagerLinks) {
    const email = normalizeEmail(link.talentManagerEmail);
    if (link.talentManagerDisplayName && !displayNameByTm.has(email)) displayNameByTm.set(email, link.talentManagerDisplayName);
  }

  const pairs = new Map<string, { amEmail: string; tmEmail: string; placements: Map<string, MissionHuntPlacement> }>();

  for (const link of talentManagerLinks) {
    const placement = placementById.get(link.projectId);
    if (!placement) continue;
    const amEmail = normalizeEmail(placement.ownerEmail);
    const tmEmail = normalizeEmail(link.talentManagerEmail);
    const key = `${amEmail}::${tmEmail}`;
    if (!pairs.has(key)) pairs.set(key, { amEmail, tmEmail, placements: new Map() });
    pairs.get(key)!.placements.set(placement.id, placement);
  }

  const entries: CrossIntelligenceEntry[] = [...pairs.values()].map(({ amEmail, tmEmail, placements: pairPlacements }) => {
    const pairPlacementList = [...pairPlacements.values()];
    return {
      accountManagerEmail: amEmail,
      accountManagerDisplayName: profileByEmail.get(amEmail)?.displayName ?? pairPlacementList[0]?.ownerDisplayName ?? amEmail,
      talentManagerEmail: tmEmail,
      talentManagerDisplayName: profileByEmail.get(tmEmail)?.displayName ?? displayNameByTm.get(tmEmail) ?? tmEmail,
      placements: pairPlacementList,
      counts: countOpportunities(pairPlacementList),
    };
  });

  return entries.sort((a, b) => b.placements.length - a.placements.length);
}

export interface TalentManagerTeamCompletion {
  verifiedCount: number;
  totalCount: number;
}

export function talentManagerTeamCompletion(summaries: readonly TalentManagerSummary[]): TalentManagerTeamCompletion {
  return { verifiedCount: summaries.filter((s) => s.isVerified).length, totalCount: summaries.length };
}
