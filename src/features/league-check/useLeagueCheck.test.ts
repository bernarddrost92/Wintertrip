import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLeagueCheck } from './useLeagueCheck';

describe('useLeagueCheck — receiptId identifies one League Check session for League Check Intelligence', () => {
  it('generates a receiptId immediately, before anything is checked', () => {
    const { result } = renderHook(() => useLeagueCheck());
    expect(result.current.receiptId).toBeTruthy();
  });

  it('stays the same receiptId across toggling checks — repeated Generate Receipt upserts one row, not several', () => {
    const { result } = renderHook(() => useLeagueCheck());
    const initialId = result.current.receiptId;

    act(() => result.current.toggleItem('timing'));
    act(() => result.current.toggleItem('hours'));

    expect(result.current.receiptId).toBe(initialId);
  });

  it('New Mission (reset) generates a fresh receiptId — a new session must count as a new receipt', () => {
    const { result } = renderHook(() => useLeagueCheck());
    const initialId = result.current.receiptId;

    act(() => result.current.toggleItem('timing'));
    act(() => result.current.reset());

    expect(result.current.receiptId).not.toBe(initialId);
    expect(result.current.checkedCount).toBe(0);
  });
});
