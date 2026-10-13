/**
 * FTE-bonnen — the team's shared list of expected FTE growth, stored in
 * public.fte_bonnen (supabase/migrations/0014_fte_bonnen.sql). Open bonnen
 * are added on top of the official Net FTE for projections; a bon marked
 * "gerealiseerd" drops out of the projection because it is then part of the
 * official Power BI figure. Every call resolves instead of throwing, so the
 * Net FTE tab keeps working (calculator, projection) when Supabase is down.
 */
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';

export type FteBonType = 'VERLENGING' | 'PO_NAAR_CONTRACT' | 'BPT_VERLENGEN' | 'NIEUWE_CONTRACTANT' | 'ANDERS';
export type FteBonStatus = 'open' | 'gerealiseerd';

export const FTE_BON_TYPES: { value: FteBonType; label: string }[] = [
  { value: 'VERLENGING', label: 'Contractverlenging' },
  { value: 'PO_NAAR_CONTRACT', label: 'PO → contract' },
  { value: 'BPT_VERLENGEN', label: 'BPT verlengen' },
  { value: 'NIEUWE_CONTRACTANT', label: 'Nieuwe contractant' },
  { value: 'ANDERS', label: 'Anders' },
];

export function fteBonTypeLabel(type: FteBonType): string {
  return FTE_BON_TYPES.find((t) => t.value === type)?.label ?? type;
}

export interface FteBon {
  id: string;
  label: string;
  type: FteBonType;
  fteDelta: number;
  owner: string | null;
  note: string | null;
  status: FteBonStatus;
  createdAt: string;
}

export interface NewFteBon {
  label: string;
  type: FteBonType;
  fteDelta: number;
  owner?: string;
  note?: string;
}

interface FteBonRow {
  id: string;
  label: string;
  action_type: FteBonType;
  /** Postgres numeric — PostgREST may serialize it as a string. */
  fte_delta: number | string;
  owner: string | null;
  note: string | null;
  status: FteBonStatus;
  created_at: string;
}

function toNumber(value: number | string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapFteBonRow(row: FteBonRow): FteBon {
  return {
    id: row.id,
    label: row.label,
    type: row.action_type,
    fteDelta: toNumber(row.fte_delta),
    owner: row.owner,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** Sum of every open bon — rounded to 2 decimals, never a float tail. */
export function sumOpenFte(bonnen: FteBon[]): number {
  return Math.round(bonnen.filter((bon) => bon.status === 'open').reduce((sum, bon) => sum + bon.fteDelta, 0) * 100) / 100;
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

/** null when Supabase isn't configured or the read fails — never a fabricated empty list. */
export async function fetchFteBonnen(): Promise<FteBon[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await getSupabaseClient().from('fte_bonnen').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;
    return (data as FteBonRow[]).map(mapFteBonRow);
  } catch {
    return null;
  }
}

export async function createFteBon(input: NewFteBon): Promise<FteBon | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await getSupabaseClient()
      .from('fte_bonnen')
      .insert({
        label: input.label.trim(),
        action_type: input.type,
        fte_delta: Math.round(input.fteDelta * 100) / 100,
        owner: blankToNull(input.owner),
        note: blankToNull(input.note),
      })
      .select()
      .single<FteBonRow>();
    if (error || !data) return null;
    return mapFteBonRow(data);
  } catch {
    return null;
  }
}

export async function updateFteBonStatus(id: string, status: FteBonStatus): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await getSupabaseClient().from('fte_bonnen').update({ status }).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteFteBon(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await getSupabaseClient().from('fte_bonnen').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
