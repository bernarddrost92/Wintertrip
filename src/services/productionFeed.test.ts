import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('getProductionFeed — mock fallback', () => {
  it('uses mock data, clearly labeled, when no feed URL is configured', async () => {
    vi.stubEnv('VITE_PRODUCTION_FEED_URL', '');
    vi.resetModules();
    const { getProductionFeed, isProductionFeedConfigured } = await import('./productionFeed');

    expect(isProductionFeedConfigured()).toBe(false);
    const result = await getProductionFeed();
    expect(result.mock).toBe(true);
    expect(result.degraded).toBe(false);
    expect(result.records.length).toBeGreaterThan(0);
  });
});

describe('getProductionFeed — live feed', () => {
  it('fetches and normalizes live records when a feed URL is configured', async () => {
    vi.stubEnv('VITE_PRODUCTION_FEED_URL', 'https://example.com/feed.json');
    vi.resetModules();
    const { getProductionFeed, isProductionFeedConfigured } = await import('./productionFeed');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          records: [
            { id: 'deal-1', accountManager: 'KS', dealType: 'Nieuwe plaatsing', startDate: '2026-09-01', endDate: '2027-04-30', monthlyDb: '10' },
          ],
        }),
      }),
    );

    expect(isProductionFeedConfigured()).toBe(true);
    const result = await getProductionFeed();
    expect(result.mock).toBe(false);
    expect(result.degraded).toBe(false);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].accountManager).toBe('KS');
    expect(result.records[0].monthlyDb).toBe(10); // Dutch-decimal-safe string -> number
  });

  it('14. a connection failure after a successful sync keeps the last successful data, marked degraded', async () => {
    vi.stubEnv('VITE_PRODUCTION_FEED_URL', 'https://example.com/feed.json');
    vi.resetModules();
    const { getProductionFeed } = await import('./productionFeed');

    const okResponse = {
      ok: true,
      json: async () => ({ records: [{ id: 'deal-1', accountManager: 'KS', dealType: 'Nieuwe plaatsing', startDate: '2026-09-01', endDate: '2027-04-30', monthlyDb: 10 }] }),
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(okResponse).mockRejectedValueOnce(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const first = await getProductionFeed();
    expect(first.mock).toBe(false);
    expect(first.degraded).toBe(false);

    const second = await getProductionFeed();
    expect(second.mock).toBe(false);
    expect(second.degraded).toBe(true);
    expect(second.records[0].accountManager).toBe('KS');
    expect(second.fetchedAt).toBe(first.fetchedAt); // the cached sync time, not "now"
  });

  it('a connection failure with no prior cache falls back to mock, still marked degraded', async () => {
    vi.stubEnv('VITE_PRODUCTION_FEED_URL', 'https://example.com/feed.json');
    vi.resetModules();
    const { getProductionFeed } = await import('./productionFeed');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await getProductionFeed();
    expect(result.mock).toBe(true);
    expect(result.degraded).toBe(true);
  });

  it('15. a new successful fetch after refresh reflects the updated feed — no code change needed', async () => {
    vi.stubEnv('VITE_PRODUCTION_FEED_URL', 'https://example.com/feed.json');
    vi.resetModules();
    const { getProductionFeed } = await import('./productionFeed');

    const responseA = {
      ok: true,
      json: async () => ({ records: [{ id: 'deal-1', accountManager: 'KS', dealType: 'Nieuwe plaatsing', startDate: '2026-09-01', endDate: '2027-04-30', monthlyDb: 10 }] }),
    };
    const responseB = {
      ok: true,
      json: async () => ({ records: [{ id: 'deal-1', accountManager: 'KS', dealType: 'Nieuwe plaatsing', startDate: '2026-09-01', endDate: '2027-04-30', monthlyDb: 20 }] }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(responseA).mockResolvedValueOnce(responseB));

    const first = await getProductionFeed();
    const second = await getProductionFeed();
    expect(first.records[0].monthlyDb).toBe(10);
    expect(second.records[0].monthlyDb).toBe(20);
  });
});
