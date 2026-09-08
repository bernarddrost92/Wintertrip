import { useEffect, useState } from 'react';
import { productionDataSource } from '../../services/productionDataSource';
import type { ProductionRecord, ProductionSourceMeta } from '../../types/production';

export function useProductionData() {
  const [records, setRecords] = useState<ProductionRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceMeta] = useState<ProductionSourceMeta>(() => productionDataSource.getSourceMeta());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productionDataSource.getProductionData().then((data) => {
      if (!cancelled) {
        setRecords(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { records, loading, sourceMeta };
}
