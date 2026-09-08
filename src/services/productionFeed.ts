/**
 * The single data-access boundary for Mission Control's production feed —
 * nothing outside this file ever calls fetch() for it, and no component
 * knows whether it's looking at a live sync, a cached "degraded" sync, or
 * mock data. Mirrors services/api.ts's live/mock pattern, plus a
 * localStorage cache so a temporary Google feed outage never zeroes out
 * the dashboard (see getProductionFeed).
 *
 * MARRE GOOGLE SHEET -> (external) sanitizer -> VITE_PRODUCTION_FEED_URL
 * JSON -> normalizeProductionFeedRecord -> this module -> Mission Control.
 * The sanitizer step (whatever turns Marre's private Sheet into the public
 * JSON contract in types/productionFeed.ts) is intentionally outside this
 * repository — this frontend never holds Google credentials or fetches the
 * private Sheet URL directly.
 */
import { normalizeProductionFeedRecord } from './normalizeProductionFeed';
import { MOCK_PRODUCTION_FEED_RECORDS } from '../data/production/mockProductionFeed';
import type { ProductionFeedRecord, ProductionFeedResult, RawProductionFeedRecord } from '../types/productionFeed';

const PRODUCTION_FEED_URL = import.meta.env.VITE_PRODUCTION_FEED_URL as string | undefined;

const CACHE_KEY = 'wintertrip-production-feed-cache-v1';

export class ProductionFeedError extends Error {}

interface CachedFeed {
  records: ProductionFeedRecord[];
  fetchedAt: string;
}

function readCache(): CachedFeed | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFeed;
    if (!Array.isArray(parsed.records) || typeof parsed.fetchedAt !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(records: ProductionFeedRecord[], fetchedAt: string): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ records, fetchedAt }));
  } catch {
    // localStorage unavailable (private browsing, quota) — the next
    // connection failure just has no cache to fall back to.
  }
}

async function fetchLiveFeed(url: string): Promise<ProductionFeedRecord[]> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new ProductionFeedError(`Production feed responded with status ${response.status}`);
  }
  const payload = (await response.json()) as unknown;
  const rawRecords = Array.isArray(payload) ? payload : (payload as { records?: unknown }).records;
  if (!Array.isArray(rawRecords)) {
    throw new ProductionFeedError('Production feed payload was not a records array.');
  }
  return (rawRecords as RawProductionFeedRecord[]).map(normalizeProductionFeedRecord);
}

function mockResult(fetchedAt: string, degraded = false): ProductionFeedResult {
  return { records: MOCK_PRODUCTION_FEED_RECORDS.map(normalizeProductionFeedRecord), mock: true, degraded, fetchedAt };
}

/**
 * Resolves the current production feed:
 * - no VITE_PRODUCTION_FEED_URL configured -> mock data, clearly labeled.
 * - configured and reachable -> live records, cached for the next failure.
 * - configured but unreachable -> the last successfully cached sync,
 *   marked degraded, never a zeroed-out or empty dashboard. If there is no
 *   cache yet (e.g. the very first load fails), falls back to mock data
 *   rather than showing nothing — still marked degraded so that's visible.
 */
export async function getProductionFeed(): Promise<ProductionFeedResult> {
  const now = new Date().toISOString();

  if (!PRODUCTION_FEED_URL) {
    return mockResult(now);
  }

  try {
    const records = await fetchLiveFeed(PRODUCTION_FEED_URL);
    writeCache(records, now);
    return { records, mock: false, degraded: false, fetchedAt: now };
  } catch (error) {
    console.warn('[operatie-wintertrip] Production feed unavailable, falling back to last known sync.', error);
    const cached = readCache();
    if (cached) {
      return { records: cached.records, mock: false, degraded: true, fetchedAt: cached.fetchedAt };
    }
    return mockResult(now, true);
  }
}

export function isProductionFeedConfigured(): boolean {
  return Boolean(PRODUCTION_FEED_URL);
}
