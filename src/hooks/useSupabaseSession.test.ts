import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useSupabaseSession } from './useSupabaseSession';

const { isSupabaseConfigured, getSupabaseClient } = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(),
  getSupabaseClient: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({ isSupabaseConfigured, getSupabaseClient }));

describe('useSupabaseSession — League Check must never crash on a Supabase failure', () => {
  beforeEach(() => {
    isSupabaseConfigured.mockReset();
    getSupabaseClient.mockReset();
  });

  it('unconfigured: resolves immediately to signed-out, never calls getSupabaseClient', () => {
    isSupabaseConfigured.mockReturnValue(false);
    const { result } = renderHook(() => useSupabaseSession());
    expect(result.current).toEqual({ userId: null, ready: true });
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it('the production incident: getSupabaseClient() throws synchronously (config that passed isSupabaseConfigured but createClient still rejects it) — resolves safely, never throws', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockImplementation(() => {
      throw new Error('Invalid URL');
    });

    const { result } = renderHook(() => useSupabaseSession());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.userId).toBeNull();
  });

  it('getSession() rejects: resolves safely to signed-out rather than an unhandled rejection', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue({
      auth: {
        getSession: () => Promise.reject(new Error('network down')),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    });

    const { result } = renderHook(() => useSupabaseSession());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.userId).toBeNull();
  });

  it('a valid session resolves the signed-in user id', async () => {
    isSupabaseConfigured.mockReturnValue(true);
    getSupabaseClient.mockReturnValue({
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'user-123' } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    });

    const { result } = renderHook(() => useSupabaseSession());

    await waitFor(() => expect(result.current.userId).toBe('user-123'));
    expect(result.current.ready).toBe(true);
  });
});
