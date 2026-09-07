/**
 * Data access boundary for Mission Control.
 *
 * The eventual production pipeline is:
 *   SharePoint Excel → Power Automate → JSON API → this module
 *
 * Nothing outside this file should know whether the data came from the mock
 * dataset or a live endpoint — components always call getLeagueDataset().
 * When VITE_LEAGUE_API_URL is unset, mock data is used automatically so the
 * UI never has a hard dependency on Excel/SharePoint being reachable.
 */
import { MOCK_LEAGUE_DATASET } from '../data/mockLeagueData';
import type { LeagueDataset } from '../types/league';

const LEAGUE_API_URL = import.meta.env.VITE_LEAGUE_API_URL as string | undefined;

export class LeagueApiError extends Error {}

async function fetchLiveDataset(url: string): Promise<LeagueDataset> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new LeagueApiError(`League API responded with status ${response.status}`);
  }
  return (await response.json()) as LeagueDataset;
}

/**
 * Resolves the current league dataset. Falls back to bundled mock data both
 * when no API URL is configured and when a configured live call fails, so
 * Mission Control always renders something during V1.
 */
export async function getLeagueDataset(): Promise<LeagueDataset> {
  if (!LEAGUE_API_URL) {
    return MOCK_LEAGUE_DATASET;
  }

  try {
    return await fetchLiveDataset(LEAGUE_API_URL);
  } catch (error) {
    console.warn('[operation-january] League API unavailable, falling back to mock data.', error);
    return MOCK_LEAGUE_DATASET;
  }
}

export function isLiveApiConfigured(): boolean {
  return Boolean(LEAGUE_API_URL);
}
