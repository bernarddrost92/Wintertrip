import { useCallback, useEffect, useRef, useState } from 'react';
import { getProductionFeed, isProductionFeedConfigured } from '../../services/productionFeed';
import type { ProductionFeedResult } from '../../types/productionFeed';

const AUTO_REFRESH_MS = 5 * 60 * 1000;

export interface UseProductionFeedResult {
  feed: ProductionFeedResult | null;
  loading: boolean;
  refreshing: boolean;
  isLive: boolean;
  refresh: () => void;
}

/** Loads the production feed on mount, re-fetches on REFRESH DATA, and
 * auto-refreshes every 5 minutes while Mission Control stays open — all
 * through the single services/productionFeed.ts boundary, so a Marre-side
 * data change (DB, dates, a new placement, AM/TM) shows up here without
 * any frontend redeploy. */
export function useProductionFeed(): UseProductionFeedResult {
  const [feed, setFeed] = useState<ProductionFeedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async (silent: boolean) => {
    if (!silent) setRefreshing(true);
    const result = await getProductionFeed();
    if (mountedRef.current) {
      setFeed(result);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load(false);
    const interval = window.setInterval(() => load(true), AUTO_REFRESH_MS);
    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [load]);

  const refresh = useCallback(() => {
    load(false);
  }, [load]);

  return { feed, loading, refreshing, isLive: isProductionFeedConfigured(), refresh };
}
