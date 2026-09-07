import { useEffect, useState } from 'react';
import { getLeagueDataset } from '../../services/api';
import type { LeagueDataset } from '../../types/league';

export function useLeagueDataset() {
  const [dataset, setDataset] = useState<LeagueDataset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLeagueDataset().then((data) => {
      if (!cancelled) {
        setDataset(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { dataset, loading };
}
