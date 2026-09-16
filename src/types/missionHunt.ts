export interface MissionHuntProfile {
  id: string;
  userId: string;
  displayName: string;
  /** Trimmed + lowercased, matches normalizeEmail() — the same value the
   * database's public.profiles.email_normalized column stores. */
  emailNormalized: string;
  /**
   * A coarse, single-valued account role — separate from AM/TM identity,
   * which stays entirely data-driven (owner_email match / a
   * placement_talent_managers row) and is never stored here.
   * manager/office_manager get the same operational placement/import/TM-
   * assignment write scope as admin, but never the ability to alter roles
   * (see missionHuntPermissions.ts + migration 0008 — profiles' own write
   * policy stays admin-only, which is the entire enforcement of that).
   * hr is read-only everywhere.
   */
  role: 'member' | 'admin' | 'manager' | 'office_manager' | 'hr';
  active: boolean;
  createdAt: string;
}

/**
 * A placement (a professional at a client) — Mission Hunt's core unit.
 * ownerId is nullable: the central Team Placement Import can create a
 * placement for someone who has never signed in yet, identified purely by
 * ownerEmail. The moment that person edits it (or it's reassigned), ownerId
 * gets filled in — see missionHuntPermissions.ts and migration 0006.
 */
export interface MissionHuntPlacement {
  id: string;
  ownerId: string | null;
  /** Normalized (trim + lowercase) — the durable ownership key. */
  ownerEmail: string;
  /** The Accountmanager name captured at import time, or the signed-in
   * user's own display name for a self-added placement — used as a
   * fallback label anywhere a real profile (post-login) isn't available
   * yet. */
  ownerDisplayName: string | null;
  professionalName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number | null;
  monthlyDb: number | null;
  note: string | null;
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields a signed-in accountmanager fills in via "+ Plaatsing toevoegen" —
 * ownership is never asked, the app already knows who's signed in. */
export interface NewPlacementInput {
  professionalName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  hoursPerWeek?: number | null;
  monthlyDb?: number | null;
  note?: string | null;
}

/** Fields an owner (or admin) may change on an existing placement — never
 * ownerEmail/ownerId themselves; see missionHuntPermissions.ts. */
export type PlacementFieldUpdate = Partial<NewPlacementInput>;

/** One row of the office manager's central Team Placement Import, already
 * shaped into canonical fields (missionHuntExcelParse.ts owns the header
 * recognition). ownerEmail is raw as typed — normalize before comparing.
 * talentManagerEmails/talentManagerDisplayNames are parallel arrays parsed
 * from the semicolon-separated "Talent Manager"/"E-mail Talent Manager"
 * columns — both empty is valid (a placement with no TM yet). */
export interface TeamImportRow {
  ownerEmail: string;
  ownerDisplayName: string;
  professionalName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number | null;
  monthlyDb: number | null;
  talentManagerEmails: string[];
  talentManagerDisplayNames: string[];
}

/**
 * The many-to-many link between one placement and one Talent Manager
 * (public.placement_talent_managers, migration 0007). A placement stays ONE
 * row in MissionHuntPlacement — this is a separate relation, never a
 * duplicated placement. talentManagerId is nullable for the same reason
 * MissionHuntPlacement.ownerId is: a TM can be linked by email before they
 * have ever signed in.
 */
export interface TalentManagerLink {
  id: string;
  projectId: string;
  /** Normalized (trim + lowercase) — the durable linkage key. */
  talentManagerEmail: string;
  talentManagerId: string | null;
  talentManagerDisplayName: string | null;
  createdAt: string;
}

/** A Talent Manager's own "ALLES KLOPT" (public.talent_manager_reviews,
 * migration 0007) — same shape and same wipe-on-change trigger behavior as
 * PlacementReview, but tracked entirely separately: the same person can be
 * both an AM and a TM with two independent confirmations. */
export interface TalentManagerReview {
  id: string;
  userId: string;
  userEmail: string;
  verifiedAt: string;
  placementCountAtVerification: number;
  createdAt: string;
}

/** A descriptive roster tag (public.team_member_roles, migration 0007) —
 * non-exclusive, a person may hold more than one row. Purely informational
 * for the future invite flow; it never gates AM/TM data access itself (that
 * stays 100% derived from ownerEmail / placement_talent_managers). */
export interface TeamMemberRole {
  id: string;
  emailNormalized: string;
  role: 'admin' | 'accountmanager' | 'talent_manager';
  createdAt: string;
}

/** The future invite roster (public.team_members) — empty until Bernard
 * supplies the real name/email list. */
export interface TeamMember {
  id: string;
  displayName: string;
  emailNormalized: string;
  active: boolean;
  createdAt: string;
}

/** "ALLES KLOPT" — one row per person, upserted on confirmation, wiped the
 * instant their placement set changes (see migration 0006's trigger). */
export interface PlacementReview {
  id: string;
  userId: string;
  userEmail: string;
  verifiedAt: string;
  placementCountAtVerification: number;
  createdAt: string;
}
