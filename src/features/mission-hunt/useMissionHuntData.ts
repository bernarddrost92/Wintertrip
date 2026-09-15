import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { buildProjectFingerprint } from '../../services/missionHuntFingerprint';
import {
  newProjectToInsertRow,
  profileRowToProfile,
  projectRowToProject,
  type ProfileRow,
  type ProjectRow,
} from '../../services/missionHuntMapping';
import type { MissionHuntProfile, MissionHuntProject, NewProjectInput, OpportunityType, ProjectStatus } from '../../types/missionHunt';

interface MissionHuntDataState {
  loading: boolean;
  error: string | null;
  profiles: MissionHuntProfile[];
  projects: MissionHuntProject[];
}

const GENERIC_ERROR = 'Er ging iets mis. Probeer het opnieuw.';

/**
 * Owns every read/write Mission Hunt makes against Supabase. RLS is the real
 * security boundary (see the migration) — this hook just gives the UI a
 * plain, typed surface on top of it and keeps local state in sync after
 * each write, so nothing here needs a full page reload to see its own
 * change.
 */
export function useMissionHuntData(currentUserId: string) {
  const [state, setState] = useState<MissionHuntDataState>({ loading: true, error: null, profiles: [], projects: [] });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const supabase = getSupabaseClient();
    const [profilesRes, projectsRes] = await Promise.all([supabase.from('profiles').select('*'), supabase.from('projects').select('*')]);

    if (profilesRes.error || projectsRes.error) {
      setState((prev) => ({ ...prev, loading: false, error: GENERIC_ERROR }));
      return;
    }

    setState({
      loading: false,
      error: null,
      profiles: (profilesRes.data as ProfileRow[]).map(profileRowToProfile),
      projects: (projectsRes.data as ProjectRow[]).map(projectRowToProject),
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const existingFingerprints = useCallback(() => new Set(state.projects.filter((p) => p.ownerId === currentUserId).map((p) => p.fingerprint)), [
    state.projects,
    currentUserId,
  ]);

  async function addProject(input: NewProjectInput): Promise<{ ok: true } | { ok: false; error: string }> {
    const fingerprint = buildProjectFingerprint(currentUserId, input.projectName, input.clientName, input.professionalName);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').insert(newProjectToInsertRow(currentUserId, input, fingerprint)).select().single();
    if (error || !data) return { ok: false, error: GENERIC_ERROR };
    setState((prev) => ({ ...prev, projects: [...prev.projects, projectRowToProject(data as ProjectRow)] }));
    return { ok: true };
  }

  /** Bulk-imports rows already filtered down to "new" by the caller (see
   * missionHuntImportPreview.ts) — duplicates are never sent here at all,
   * rather than relying only on the database's unique constraint to reject
   * them after the fact. */
  async function importProjects(rows: { input: NewProjectInput; fingerprint: string }[]): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
    if (rows.length === 0) return { ok: true, count: 0 };
    const supabase = getSupabaseClient();
    const insertRows = rows.map(({ input, fingerprint }) => newProjectToInsertRow(currentUserId, input, fingerprint));
    const { data, error } = await supabase.from('projects').insert(insertRows).select();
    if (error || !data) return { ok: false, error: GENERIC_ERROR };
    const inserted = (data as ProjectRow[]).map(projectRowToProject);
    setState((prev) => ({ ...prev, projects: [...prev.projects, ...inserted] }));
    return { ok: true, count: inserted.length };
  }

  async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<{ ok: true } | { ok: false; error: string }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').update({ status }).eq('id', projectId).select().single();
    if (error || !data) return { ok: false, error: GENERIC_ERROR };
    const updated = projectRowToProject(data as ProjectRow);
    setState((prev) => ({ ...prev, projects: prev.projects.map((p) => (p.id === projectId ? updated : p)) }));
    return { ok: true };
  }

  async function updateProjectOpportunityTypes(projectId: string, opportunityTypes: OpportunityType[]): Promise<{ ok: true } | { ok: false; error: string }> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').update({ opportunity_types: opportunityTypes }).eq('id', projectId).select().single();
    if (error || !data) return { ok: false, error: GENERIC_ERROR };
    const updated = projectRowToProject(data as ProjectRow);
    setState((prev) => ({ ...prev, projects: prev.projects.map((p) => (p.id === projectId ? updated : p)) }));
    return { ok: true };
  }

  async function updateProjectFields(
    projectId: string,
    fields: Partial<NewProjectInput>,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const supabase = getSupabaseClient();
    const patch: Record<string, unknown> = {};
    if (fields.projectName !== undefined) patch.project_name = fields.projectName;
    if (fields.clientName !== undefined) patch.client_name = fields.clientName;
    if (fields.professionalName !== undefined) patch.professional_name = fields.professionalName;
    if (fields.startDate !== undefined) patch.start_date = fields.startDate;
    if (fields.endDate !== undefined) patch.end_date = fields.endDate;
    if (fields.hoursPerWeek !== undefined) patch.hours_per_week = fields.hoursPerWeek;
    if (fields.monthlyVcdb !== undefined) patch.monthly_vcdb = fields.monthlyVcdb;
    if (fields.note !== undefined) patch.note = fields.note;

    const { data, error } = await supabase.from('projects').update(patch).eq('id', projectId).select().single();
    if (error || !data) return { ok: false, error: GENERIC_ERROR };
    const updated = projectRowToProject(data as ProjectRow);
    setState((prev) => ({ ...prev, projects: prev.projects.map((p) => (p.id === projectId ? updated : p)) }));
    return { ok: true };
  }

  async function deleteProject(projectId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) return { ok: false, error: GENERIC_ERROR };
    setState((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== projectId) }));
    return { ok: true };
  }

  return {
    ...state,
    refresh,
    existingFingerprints,
    addProject,
    importProjects,
    updateProjectStatus,
    updateProjectOpportunityTypes,
    updateProjectFields,
    deleteProject,
  };
}
