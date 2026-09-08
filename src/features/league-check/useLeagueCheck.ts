import { useMemo, useState } from 'react';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import type { LeagueCheckState } from '../../types/league';
import { isoDateToday } from '../../utils/dates';

const INITIAL_STATE: LeagueCheckState = {
  reviewer: '',
  checkDate: isoDateToday(),
  checkedItems: {},
};

/**
 * Agent name and Professional name live in the shared Mission Flow context
 * (missionFlowContext.ts) rather than here, so they survive navigating away
 * and back — this hook only tracks the checklist itself.
 */
export function useLeagueCheck() {
  const [state, setState] = useState<LeagueCheckState>(INITIAL_STATE);

  function update<K extends keyof Omit<LeagueCheckState, 'checkedItems'>>(key: K, value: LeagueCheckState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleItem(id: string) {
    setState((prev) => ({
      ...prev,
      checkedItems: { ...prev.checkedItems, [id]: !prev.checkedItems[id] },
    }));
  }

  function reset() {
    setState(INITIAL_STATE);
  }

  const checkedCount = useMemo(
    () => LEAGUE_CHECK_ITEMS.filter((item) => state.checkedItems[item.id]).length,
    [state.checkedItems],
  );

  /** 6/6 alone determines Mission Approved — it no longer also requires the
   * Reviewer/Agent/Professional fields to be filled in. Receipt generation
   * itself is never gated on this at all: a Mission Receipt is available at
   * any checked count, this only decides which status it shows. */
  const missionApproved = checkedCount === LEAGUE_CHECK_ITEMS.length;

  return { state, update, toggleItem, reset, checkedCount, total: LEAGUE_CHECK_ITEMS.length, missionApproved };
}
