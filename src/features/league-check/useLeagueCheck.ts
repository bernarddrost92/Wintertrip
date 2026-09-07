import { useMemo, useState } from 'react';
import { LEAGUE_CHECK_ITEMS } from '../../data/leagueCheckItems';
import type { LeagueCheckState } from '../../types/league';
import { isoDateToday } from '../../utils/dates';

const INITIAL_STATE: LeagueCheckState = {
  professional: '',
  accountManager: '',
  reviewer: '',
  checkDate: isoDateToday(),
  checkedItems: {},
};

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

  const allChecked = checkedCount === LEAGUE_CHECK_ITEMS.length;

  const fieldsComplete = Boolean(state.professional.trim() && state.accountManager.trim() && state.reviewer.trim());

  const missionApproved = allChecked && fieldsComplete;

  return { state, update, toggleItem, reset, checkedCount, total: LEAGUE_CHECK_ITEMS.length, allChecked, fieldsComplete, missionApproved };
}
