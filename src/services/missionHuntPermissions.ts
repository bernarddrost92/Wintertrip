import type { MissionHuntProfile, MissionHuntProject } from '../types/missionHunt';

/**
 * Client-side mirror of the Supabase RLS policies — used only to decide what
 * the UI offers (an edit control, a delete button). The database is the
 * actual authority: every write still goes through RLS, so this function
 * being wrong would fail closed (a blocked Supabase write), never open.
 */
export function canEditProject(project: Pick<MissionHuntProject, 'ownerId'>, currentUserId: string, role: MissionHuntProfile['role']): boolean {
  return role === 'admin' || project.ownerId === currentUserId;
}
