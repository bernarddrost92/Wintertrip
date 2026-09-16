import { normalizeEmail } from '../utils/normalizeEmail';
import { buildPlacementFingerprint } from './missionHuntFingerprint';
import type { TeamImportRow } from '../types/missionHunt';

/**
 * Classifies every row of a parsed Team Placement Import against the
 * current placements table by fingerprint (owner email + professional +
 * client + start + end — the identity fields; see missionHuntFingerprint.ts).
 * A fingerprint match with every OTHER field also equal is UNCHANGED; a
 * fingerprint match where hours/DB/the accountmanager's display name
 * differ is CHANGED (admin must explicitly confirm before it's written); no
 * fingerprint match at all is NEW. Nothing is written here — this only
 * classifies; missionHuntImportRun.ts (or the caller) decides what to
 * actually send to Supabase, and never sends UNCHANGED rows at all, so an
 * unaffected owner's ALLES KLOPT confirmation is never touched.
 */

export interface ImportRowError {
  rowNumber: number;
  reason: string;
}

export interface NewImportRow {
  rowNumber: number;
  row: TeamImportRow;
  fingerprint: string;
}

export type ChangedField = 'ownerDisplayName' | 'hoursPerWeek' | 'monthlyDb';

export interface ChangedImportRow {
  rowNumber: number;
  row: TeamImportRow;
  fingerprint: string;
  existingId: string;
  changedFields: ChangedField[];
}

export interface UnchangedImportRow {
  rowNumber: number;
  row: TeamImportRow;
  fingerprint: string;
  /** null when this row is simply a duplicate of an earlier NEW row within
   * the same import batch (nothing to write for either — see
   * "same file twice"/"duplicate rows" in the import test matrix). */
  existingId: string | null;
}

export interface AccountManagerImportSummary {
  displayName: string;
  emailNormalized: string;
  count: number;
}

export interface TeamImportPreview {
  totalFound: number;
  newRows: NewImportRow[];
  changedRows: ChangedImportRow[];
  unchangedRows: UnchangedImportRow[];
  errorRows: ImportRowError[];
  accountManagers: AccountManagerImportSummary[];
}

export interface ExistingPlacementForImport {
  id: string;
  fingerprint: string;
  ownerDisplayName: string | null;
  hoursPerWeek: number | null;
  monthlyDb: number | null;
}

export type ParsedImportRow = { rowNumber: number } & ({ ok: true; row: TeamImportRow } | { ok: false; reason: string });

export function buildTeamImportPreview(parsedRows: ParsedImportRow[], existingPlacements: readonly ExistingPlacementForImport[]): TeamImportPreview {
  const existingByFingerprint = new Map(existingPlacements.map((p) => [p.fingerprint, p]));
  const seenInBatch = new Map<string, string | null>(); // fingerprint -> existingId (or null for an in-batch-only NEW)

  const newRows: NewImportRow[] = [];
  const changedRows: ChangedImportRow[] = [];
  const unchangedRows: UnchangedImportRow[] = [];
  const errorRows: ImportRowError[] = [];
  const accountManagerCounts = new Map<string, AccountManagerImportSummary>();

  for (const parsed of parsedRows) {
    if (!parsed.ok) {
      errorRows.push({ rowNumber: parsed.rowNumber, reason: parsed.reason });
      continue;
    }

    const { row, rowNumber } = parsed;
    const emailNormalized = normalizeEmail(row.ownerEmail);
    const fingerprint = buildPlacementFingerprint(emailNormalized, row.professionalName, row.clientName, row.startDate, row.endDate);

    const existingAm = accountManagerCounts.get(emailNormalized);
    accountManagerCounts.set(emailNormalized, {
      displayName: existingAm?.displayName ?? row.ownerDisplayName,
      emailNormalized,
      count: (existingAm?.count ?? 0) + 1,
    });

    if (seenInBatch.has(fingerprint)) {
      unchangedRows.push({ rowNumber, row, fingerprint, existingId: seenInBatch.get(fingerprint) ?? null });
      continue;
    }

    const existing = existingByFingerprint.get(fingerprint);
    if (!existing) {
      newRows.push({ rowNumber, row, fingerprint });
      seenInBatch.set(fingerprint, null);
      continue;
    }

    const changedFields: ChangedField[] = [];
    if ((existing.ownerDisplayName ?? '') !== row.ownerDisplayName) changedFields.push('ownerDisplayName');
    if ((existing.hoursPerWeek ?? null) !== (row.hoursPerWeek ?? null)) changedFields.push('hoursPerWeek');
    if ((existing.monthlyDb ?? null) !== (row.monthlyDb ?? null)) changedFields.push('monthlyDb');

    if (changedFields.length === 0) {
      unchangedRows.push({ rowNumber, row, fingerprint, existingId: existing.id });
    } else {
      changedRows.push({ rowNumber, row, fingerprint, existingId: existing.id, changedFields });
    }
    seenInBatch.set(fingerprint, existing.id);
  }

  return {
    totalFound: parsedRows.length,
    newRows,
    changedRows,
    unchangedRows,
    errorRows,
    accountManagers: [...accountManagerCounts.values()].sort((a, b) => b.count - a.count),
  };
}
