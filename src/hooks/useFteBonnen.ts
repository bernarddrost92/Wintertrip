import { useCallback, useEffect, useState } from 'react';
import { createFteBon, deleteFteBon, fetchFteBonnen, sumOpenFte, updateFteBonStatus, type FteBon, type NewFteBon } from '../services/fteBonnen';

export type FteBonnenStatus = 'loading' | 'ready' | 'unavailable';

export interface UseFteBonnenResult {
  status: FteBonnenStatus;
  bonnen: FteBon[];
  openBonnen: FteBon[];
  /** Total FTE of open bonnen — 0 while loading or unavailable, so projections fall back to the official stand. */
  openFte: number;
  saving: boolean;
  /** The saved bon, or null when saving failed. */
  add: (bon: NewFteBon) => Promise<FteBon | null>;
  markRealized: (id: string) => Promise<void>;
  reopen: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** The shared FTE-bonnen list (services/fteBonnen.ts), loaded once per mount. */
export function useFteBonnen(): UseFteBonnenResult {
  const [status, setStatus] = useState<FteBonnenStatus>('loading');
  const [bonnen, setBonnen] = useState<FteBon[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFteBonnen().then((result) => {
      if (cancelled) return;
      if (result) {
        setBonnen(result);
        setStatus('ready');
      } else {
        setStatus('unavailable');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (input: NewFteBon) => {
    setSaving(true);
    const created = await createFteBon(input);
    setSaving(false);
    if (!created) return null;
    setBonnen((prev) => [created, ...prev]);
    setStatus('ready');
    return created;
  }, []);

  const setStatusFor = useCallback(async (id: string, next: FteBon['status']) => {
    if (await updateFteBonStatus(id, next)) setBonnen((prev) => prev.map((bon) => (bon.id === id ? { ...bon, status: next } : bon)));
  }, []);

  const remove = useCallback(async (id: string) => {
    if (await deleteFteBon(id)) setBonnen((prev) => prev.filter((bon) => bon.id !== id));
  }, []);

  const openBonnen = bonnen.filter((bon) => bon.status === 'open');

  return {
    status,
    bonnen,
    openBonnen,
    openFte: sumOpenFte(bonnen),
    saving,
    add,
    markRealized: (id) => setStatusFor(id, 'gerealiseerd'),
    reopen: (id) => setStatusFor(id, 'open'),
    remove,
  };
}
