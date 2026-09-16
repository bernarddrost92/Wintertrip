import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { normalizeEmail } from '../../utils/normalizeEmail';
import {
  newPlacementToInsertRow,
  placementReviewRowToPlacementReview,
  placementRowToPlacement,
  profileRowToProfile,
  teamImportRowToInsertRow,
  teamMemberRowToTeamMember,
  type PlacementRow,
  type PlacementReviewRow,
  type ProfileRow,
  type TeamMemberRow,
} from '../../services/missionHuntMapping';
import { countOpportunities } from '../../services/missionHuntAggregate';
import type { TeamImportPreview } from '../../services/missionHuntImportPreview';
import type { MissionHuntPlacement, MissionHuntProfile, NewPlacementInput, PlacementFieldUpdate, PlacementReview, TeamMember } from '../../types/missionHunt';

interface MissionHuntDataState {
  loading: boolean;
  error: string | null;
  profiles: MissionHuntProfile[];
  placements: MissionHuntPlacement[];
  teamMembers: TeamMember[];
  placementReviews: PlacementReview[];
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
  const [state, setState] = useState<MissionHuntDataState>({ loading: true, error: null, profiles: [], placements: [], teamMembers: [], placementReviews: [] });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const supabase = getSupabaseClient();
      const [profilesRes, placementsRes, teamMembersRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('placement_reviews').select('*'),
      ]);

      if (profilesRes.error || placementsRes.error || teamMembersRes.error || reviewsRes.error) {
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
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: GENERIC_ERROR }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function addPlacement(input: NewPlacementInput): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const insertRow = newPlacementToInsertRow(profile.userId, profile.emailNormalized, profile.displayName, input);
      const { data, error } = await supabase.from('projects').insert(insertRow).select().single();
      if (error || !data) return { ok: false, error: GENERIC_ERROR };
      setState((prev) => ({ ...prev, placements: [...prev.placements, placementRowToPlacement(data as PlacementRow)] }));
      return { ok: true };
    });
  }

  /** Writes only the NEW and CHANGED rows a Team Placement Import preview
   * classified — UNCHANGED and ERROR rows are never sent, so an unaffected
   * owner's ALLES KLOPT confirmation is never touched (see migration
   * 0006's invalidation trigger). */
  function importTeamPlacements(preview: TeamImportPreview): Promise<WriteResult<{ newCount: number; changedCount: number }>> {
    return safeCall<{ newCount: number; changedCount: number }>(async () => {
      const supabase = getSupabaseClient();

      if (preview.newRows.length > 0) {
        const insertRows = preview.newRows.map(({ row, fingerprint }) => teamImportRowToInsertRow(row, fingerprint));
        const { data, error } = await supabase.from('projects').insert(insertRows).select();
        if (error || !data) return { ok: false, error: GENERIC_ERROR };
        const inserted = (data as PlacementRow[]).map(placementRowToPlacement);
        setState((prev) => ({ ...prev, placements: [...prev.placements, ...inserted] }));
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
      }

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
      return { ok: true };
    });
  }

  function deletePlacement(placementId: string): Promise<WriteResult> {
    return safeCall(async () => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('projects').delete().eq('id', placementId);
      if (error) return { ok: false, error: GENERIC_ERROR };
      setState((prev) => ({ ...prev, placements: prev.placements.filter((p) => p.id !== placementId) }));
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

  return {
    ...state,
    refresh,
    addPlacement,
    importTeamPlacements,
    updatePlacementField,
    reassignPlacement,
    deletePlacement,
    submitVerification,
    countOpportunities,
  };
}
