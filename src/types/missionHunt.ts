export interface MissionHuntProfile {
  id: string;
  userId: string;
  displayName: string;
  /** Trimmed + lowercased, matches normalizeEmail() — the same value the
   * database's public.profiles.email_normalized column stores. */
  emailNormalized: string;
  role: 'member' | 'admin';
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
 * recognition). ownerEmail is raw as typed — normalize before comparing. */
export interface TeamImportRow {
  ownerEmail: string;
  ownerDisplayName: string;
  professionalName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number | null;
  monthlyDb: number | null;
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
