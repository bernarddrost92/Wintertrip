import { withBase } from '../utils/assetPath';
import type { IsoDate } from '../types/league';

/**
 * Central Mission Updates catalog. Adding a new transmission later only
 * ever requires: (1) drop the MP4 (and optionally a poster) into
 * public/mission-updates/, (2) add one object below. Nothing else — no new
 * page or component is needed per video; Latest Transmission and the
 * Archive both derive automatically from this one array via
 * getSortedMissionUpdates().
 */
export interface MissionUpdate {
  id: string;
  /** ISO date (YYYY-MM-DD) — sorting and display both derive from this,
   * never from array order. */
  date: IsoDate;
  title: string;
  subtitle?: string;
  /** Resolved against Vite's BASE_URL — never a bare "/..." root path. */
  videoSrc: string;
  posterSrc?: string;
  featured?: boolean;
}

export const missionUpdates: MissionUpdate[] = [
  {
    id: 'pak-september-mee',
    date: '2026-09-14',
    title: 'Pak september mee',
    subtitle: '1 dag eerder = een extra league-maand',
    videoSrc: withBase('mission-updates/mission-update-september.mp4'),
    posterSrc: withBase('mission-updates/mission-update-september-poster.jpg'),
    featured: true,
  },
];

/** Newest date first — never relies on the array's own declaration order. */
export function getSortedMissionUpdates(updates: MissionUpdate[] = missionUpdates): MissionUpdate[] {
  return [...updates].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** The newest valid Mission Update — the one Latest Transmission shows. */
export function getLatestMissionUpdate(updates: MissionUpdate[] = missionUpdates): MissionUpdate | null {
  return getSortedMissionUpdates(updates)[0] ?? null;
}

/** "TRANSMISSION 001" — position counts from the OLDEST update (date order),
 * so a transmission's number never changes as later updates are added. */
export function getTransmissionLabel(update: MissionUpdate, updates: MissionUpdate[] = missionUpdates): string {
  const oldestFirst = [...updates].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const index = oldestFirst.findIndex((u) => u.id === update.id);
  const position = index === -1 ? oldestFirst.length : index + 1;
  return `TRANSMISSION ${String(position).padStart(3, '0')}`;
}
