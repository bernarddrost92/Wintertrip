import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { normalizeEmail } from '../../utils/normalizeEmail';
import {
  newPlacementToInsertRow,
  placementReviewRowToPlacementReview,
  placementRowToPlacement,
  profileRowToProfile,
  talentManagerEmailsToInsertRows,
  talentManagerLinkRowToTalentManagerLink,
  talentManagerReviewRowToTalentManagerReview,
  teamImportRowToInsertRow,
  teamMemberRowToTeamMember,
  type PlacementRow,
  type PlacementReviewRow,
  type ProfileRow,
  type TalentManagerLinkRow,
  type TalentManagerReviewRow,
  type TeamMemberRow,
} from '../../services/missionHuntMapping';
import { countOpportunities } from '../../services/missionHuntAggregate';
import type { TeamImportPreview } from '../../services/missionHuntImportPreview';
import type {
  MissionHuntPlacement,
  MissionHuntProfile,
  NewPlacementInput,
  PlacementFieldUpdate,
  PlacementReview,
  TalentManagerLink,
  TalentManagerReview,
  TeamMember,
} from '../../types/missionHunt';

interface MissionHuntDataState {
  loading: boolean;
  error: string | null;
  profiles: MissionHuntProfile[];
  placements: MissionHuntPlacement[];
  teamMembers: TeamMember[];
  placementReviews: PlacementReview[];
  talentManagerLinks: TalentManagerLink[];
  talentManagerReviews: TalentManagerReview[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type WriteResult<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const GENERIC_ERROR = 'Er ging iets mis. Probeer het opnieuw.';

const FIELD_TO_COLUMN: Record<keyof PlacementFieldUpdate, string> = {
  professionalName: 'professional_name',
  clientName: 'client_name',
  startDate: 'start_date',
  endDate: 'end_date',
  hoursPerWeek: 'hours_per_week',
  monthlyDb: 'monthly_vcdb',
  note: 'note',
};

/** Every write below goes through this — a genuinely thrown/rejected
 * Supabase call (network down, unexpected shape) is caught here exactly
 * like a normal {error} response, so nothing here ever produces an
 * unhandled promise rejection. */
async function safeCall<T>(fn: () => Promise<WriteResult<T>>): Promise<WriteResult<T>> {
  try {
    return await fn();
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

/**
 * Owns every read/write Mission Hunt makes against Supabase. RLS is the
 * real security boundary (see migration 0006) — this hook just gives the
 * UI a plain, typed surface on top of it and keeps local state in sync
 * after each write, so nothing here needs a full page reload to see its
 * own change.
 */
export function useMissionHuntData(profile: MissionHuntProfile) {
  const [state, setState] = useState<MissionHuntDataState>({
    loading: true,
    error: null,
    profiles: [],
    placements: [],
    teamMembers: [],
    placementReviews: [],
    talentManagerLinks: [],
    talentManagerReviews: [],
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const supabase = getSupabaseClient();
      const [profilesRes, placementsRes, teamMembersRes, reviewsRes, tmLinksRes, tmReviewsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('placement_reviews').select('*'),
        supabase.from('placement_talent_managers').select('*'),
        supabase.from('talent_manager_reviews').select('*'),
      ]);

      if (profilesRes.error || placementsRes.error || teamMembersRes.error || reviewsRes.error || tmLinksRes.error || tmReviewsRes.error) {
        setState((prev) => ({ ...prev, loading: false, error: GENERIC_ERROR }));
        return;
      }

      setState({
        loading: false,
        error: null,
        profiles: (profilesRes.data as ProfileRow[]).map(profileRowToProfile),
        placements: (placementsRes.data as PlacementRow[]).map(placementRowToPlacement),
        teamMembers: (teamMembersRes.data as TeamMemberRow[]).map(teamMemberRowToTeamMember),
        placementReviews: (reviewsRes.data as PlacementReviewRow[]).map(placementReviewRowToPlacementReview),
        talentManagerLinks: (tmLinksRes.data as TalentManagerLinkRow[]).map(talentManagerLinkRowToTalentManagerLink),
        talentManagerReviews: (tmReviewsRes.data as TalentManagerReviewRow[]).map(talentManagerReviewRowToTalentManagerReview),
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: GENERIC_ERROR }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Any insert/update/delete on projects fires migration 0006/0007's
   * triggers, which may silently delete someone's placement_reviews row
   * (the AM confirmation) and/or one or more talent_manager_reviews rows
   * (every currently-linked TM's confirmation) server-side. Local state
   * must re-sync after every such write, or ALLES KLOPT / TM CHECK can keep
   * showing GECONTROLEERD in the UI after the DB has already invalidated
   * it. */
  const refreshReviews = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const [reviewsRes, tmReviewsRes] = await Promise.all([supabase.from('placement_reviews').select('*'), supabase.from('talent_manager_reviews').select('*')]);
      if (reviewsRes.error || tmReviewsRes.error) return;
      setState((prev) => ({
        ...prev,
        placementReviews: (reviewsRes.data as PlacementReviewRow[]).map(placementReviewRowToPlacementReview),
        talentManagerReviews: (tmReviewsRes.data as TalentManagerReviewRow[]).map(talentManagerReviewRowToTalentManagerReview),
      }));
    } catch {
      // best-effort — a stale local review is corrected on the next full refresh() anyway.
    }
  }, []);

  function addPlacement(input: NewPlacementInput): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const insertRow = newPlacementToInsertRow(profile.userId, profile.emailNormalized, profile.displayName, input);
      const { data, error } = await supabase.from('projects').insert(insertRow).select().single();
      if (error || !data) return { ok: false, error: GENERIC_ERROR };
      setState((prev) => ({ ...prev, placements: [...prev.placements, placementRowToPlacement(data as PlacementRow)] }));
      await refreshReviews();
      return { ok: true };
    });
  }

  /** Writes only the NEW and CHANGED rows a Team Placement Import preview
   * classified — UNCHANGED and ERROR rows are never sent, so an unaffected
   * owner's ALLES KLOPT confirmation is never touched (see migration
   * 0006's invalidation trigger). A row's Talent Managers are written as
   * placement_talent_managers relations, never as duplicated placements
   * (Option B — one placement row, N TM relation rows). */
  function importTeamPlacements(preview: TeamImportPreview): Promise<WriteResult<{ newCount: number; changedCount: number }>> {
    return safeCall<{ newCount: number; changedCount: number }>(async () => {
      const supabase = getSupabaseClient();

      if (preview.newRows.length > 0) {
        const insertRows = preview.newRows.map(({ row, fingerprint }) => teamImportRowToInsertRow(row, fingerprint));
        const { data, error } = await supabase.from('projects').insert(insertRows).select();
        if (error || !data) return { ok: false, error: GENERIC_ERROR };
        const insertedRows = data as PlacementRow[];
        const inserted = insertedRows.map(placementRowToPlacement);
        setState((prev) => ({ ...prev, placements: [...prev.placements, ...inserted] }));

        // Match inserted rows back to their source row by fingerprint (unique
        // within this batch) rather than array order, which Postgres/PostgREST
        // never guarantees for a bulk insert.
        const projectIdByFingerprint = new Map(insertedRows.map((r) => [r.fingerprint, r.id]));
        const tmInsertRows = preview.newRows.flatMap(({ row, fingerprint }) => {
          const projectId = projectIdByFingerprint.get(fingerprint);
          if (!projectId || row.talentManagerEmails.length === 0) return [];
          return talentManagerEmailsToInsertRows(projectId, row.talentManagerEmails, row.talentManagerDisplayNames);
        });
        if (tmInsertRows.length > 0) {
          const { data: tmData, error: tmError } = await supabase.from('placement_talent_managers').insert(tmInsertRows).select();
          if (tmError || !tmData) return { ok: false, error: GENERIC_ERROR };
          const insertedLinks = (tmData as TalentManagerLinkRow[]).map(talentManagerLinkRowToTalentManagerLink);
          setState((prev) => ({ ...prev, talentManagerLinks: [...prev.talentManagerLinks, ...insertedLinks] }));
        }
      }

      for (const changed of preview.changedRows) {
        const { data, error } = await supabase
          .from('projects')
          .update({ owner_display_name: changed.row.ownerDisplayName, hours_per_week: changed.row.hoursPerWeek, monthly_vcdb: changed.row.monthlyDb })
          .eq('id', changed.existingId)
          .select()
          .single();
        if (error || !data) return { ok: false, error: GENERIC_ERROR };
        const updated = placementRowToPlacement(data as PlacementRow);
        setState((prev) => ({ ...prev, placements: prev.placements.map((p) => (p.id === updated.id ? updated : p)) }));

        if (changed.changedFields.includes('talentManagers')) {
          const { error: delError } = await supabase.from('placement_talent_managers').delete().eq('project_id', changed.existingId);
          if (delError) return { ok: false, error: GENERIC_ERROR };
          let insertedLinks: TalentManagerLinkRow[] = [];
          if (changed.row.talentManagerEmails.length > 0) {
            const rows = talentManagerEmailsToInsertRows(changed.existingId, changed.row.talentManagerEmails, changed.row.talentManagerDisplayNames);
            const { data: tmData, error: tmInsertError } = await supabase.from('placement_talent_managers').insert(rows).select();
            if (tmInsertError || !tmData) return { ok: false, error: GENERIC_ERROR };
            insertedLinks = tmData as TalentManagerLinkRow[];
          }
          setState((prev) => ({
            ...prev,
            talentManagerLinks: [...prev.talentManagerLinks.filter((l) => l.projectId !== changed.existingId), ...insertedLinks.map(talentManagerLinkRowToTalentManagerLink)],
          }));
        }
      }

      await refreshReviews();
      return { ok: true, newCount: preview.newRows.length, changedCount: preview.changedRows.length };
    });
  }

  function updatePlacementField(placementId: string, field: keyof PlacementFieldUpdate, value: string | number | null): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .update({ [FIELD_TO_COLUMN[field]]: value })
        .eq('id', placementId)
        .select()
        .single();
      if (error || !data) return { ok: false, error: GENERIC_ERROR };
      const updated = placementRowToPlacement(data as PlacementRow);
      setState((prev) => ({ ...prev, placements: prev.placements.map((p) => (p.id === placementId ? updated : p)) }));
      await refreshReviews();
      return { ok: true };
    });
  }

  /** Admin-only: reassigning always clears owner_id — the new owner claims
   * it themselves the next time they touch it (see the RLS policy). */
  function reassignPlacement(placementId: string, ownerEmail: string, ownerDisplayName: string): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .update({ owner_id: null, owner_email: normalizeEmail(ownerEmail), owner_display_name: ownerDisplayName || null })
        .eq('id', placementId)
        .select()
        .single();
      if (error || !data) return { ok: false, error: GENERIC_ERROR };
      const updated = placementRowToPlacement(data as PlacementRow);
      setState((prev) => ({ ...prev, placements: prev.placements.map((p) => (p.id === placementId ? updated : p)) }));
      await refreshReviews();
      return { ok: true };
    });
  }

  function deletePlacement(placementId: string): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('projects').delete().eq('id', placementId);
      if (error) return { ok: false, error: GENERIC_ERROR };
      // The FK's on-delete-cascade already removed its placement_talent_managers
      // rows server-side — drop them from local state too.
      setState((prev) => ({
        ...prev,
        placements: prev.placements.filter((p) => p.id !== placementId),
        talentManagerLinks: prev.talentManagerLinks.filter((l) => l.projectId !== placementId),
      }));
      await refreshReviews();
      return { ok: true };
    });
  }

  /** Admin-only (mirrors migration 0007's RLS): replaces the full set of
   * Talent Managers linked to one placement in a single call — the drawer's
   * checkbox UX always sends the complete desired set, so this diffs
   * against current state and only writes what actually changed. */
  function setPlacementTalentManagers(projectId: string, emails: string[], displayNames: string[]): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const normalizedEmails = emails.map(normalizeEmail);
      const currentLinks = state.talentManagerLinks.filter((l) => l.projectId === projectId);
      const currentEmails = new Set(currentLinks.map((l) => l.talentManagerEmail));
      const desiredEmails = new Set(normalizedEmails);

      const toRemoveIds = currentLinks.filter((l) => !desiredEmails.has(l.talentManagerEmail)).map((l) => l.id);
      const toAddIndexes = normalizedEmails.map((_, i) => i).filter((i) => !currentEmails.has(normalizedEmails[i]));

      if (toRemoveIds.length > 0) {
        const { error } = await supabase.from('placement_talent_managers').delete().in('id', toRemoveIds);
        if (error) return { ok: false, error: GENERIC_ERROR };
      }

      let insertedLinks: TalentManagerLinkRow[] = [];
      if (toAddIndexes.length > 0) {
        const rows = talentManagerEmailsToInsertRows(
          projectId,
          toAddIndexes.map((i) => emails[i]),
          toAddIndexes.map((i) => displayNames[i]),
        );
        const { data, error } = await supabase.from('placement_talent_managers').insert(rows).select();
        if (error || !data) return { ok: false, error: GENERIC_ERROR };
        insertedLinks = data as TalentManagerLinkRow[];
      }

      setState((prev) => ({
        ...prev,
        talentManagerLinks: [
          ...prev.talentManagerLinks.filter((l) => l.projectId !== projectId || !toRemoveIds.includes(l.id)),
          ...insertedLinks.map(talentManagerLinkRowToTalentManagerLink),
        ],
      }));
      await refreshReviews();
      return { ok: true };
    });
  }

  /** ALLES KLOPT — upserts by user_id (not id, which is always freshly
   * random) so re-confirming updates the same row rather than piling up
   * duplicates; the unique(user_id) constraint is exactly what onConflict
   * targets here. */
  function submitVerification(myPlacementCount: number): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('placement_reviews')
        .upsert(
          { user_id: profile.userId, user_email: profile.emailNormalized, verified_at: new Date().toISOString(), placement_count_at_verification: myPlacementCount },
          { onConflict: 'user_id' },
        )
        .select()
        .single();
      if (error || !data) return { ok: false, error: GENERIC_ERROR };
      const updated = placementReviewRowToPlacementReview(data as PlacementReviewRow);
      setState((prev) => ({ ...prev, placementReviews: [...prev.placementReviews.filter((r) => r.userId !== updated.userId), updated] }));
      return { ok: true };
    });
  }

  /** TM CHECK — a Talent Manager's own "ALLES KLOPT", tracked entirely
   * separately from an Accountmanager's (see talent_manager_reviews,
   * migration 0007). Same upsert-by-user_id pattern as submitVerification. */
  function submitTalentManagerVerification(myLinkedPlacementCount: number): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('talent_manager_reviews')
        .upsert(
          { user_id: profile.userId, user_email: profile.emailNormalized, verified_at: new Date().toISOString(), placement_count_at_verification: myLinkedPlacementCount },
          { onConflict: 'user_id' },
        )
        .select()
        .single();
      if (error || !data) return { ok: false, error: GENERIC_ERROR };
      const updated = talentManagerReviewRowToTalentManagerReview(data as TalentManagerReviewRow);
      setState((prev) => ({ ...prev, talentManagerReviews: [...prev.talentManagerReviews.filter((r) => r.userId !== updated.userId), updated] }));
      return { ok: true };
    });
  }

  return {
    ...state,
    refresh,
    addPlacement,
    importTeamPlacements,
    updatePlacementField,
    reassignPlacement,
    deletePlacement,
    setPlacementTalentManagers,
    submitVerification,
    submitTalentManagerVerification,
    countOpportunities,
  };
}
