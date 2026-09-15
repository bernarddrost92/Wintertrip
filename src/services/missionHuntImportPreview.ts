import { buildProjectFingerprint } from './missionHuntFingerprint';
import type { NewProjectInput } from '../types/missionHunt';

export interface FingerprintedRow {
  input: NewProjectInput;
  fingerprint: string;
}

export interface ImportPreview {
  totalFound: number;
  newRows: FingerprintedRow[];
  existingRows: FingerprintedRow[];
}

/**
 * Splits parsed rows into "new" vs "already exists" against the owner's
 * current project fingerprints. Also dedupes within the batch itself — two
 * identical rows pasted or imported in the same go must not both count as
 * "new" (that would still create a duplicate), so the running set grows as
 * rows are classified.
 */
export function buildImportPreview(rows: NewProjectInput[], ownerId: string, existingFingerprints: ReadonlySet<string>): ImportPreview {
  const seen = new Set(existingFingerprints);
  const newRows: FingerprintedRow[] = [];
  const existingRows: FingerprintedRow[] = [];

  for (const input of rows) {
    const fingerprint = buildProjectFingerprint(ownerId, input.projectName, input.clientName, input.professionalName);
    if (seen.has(fingerprint)) {
      existingRows.push({ input, fingerprint });
    } else {
      seen.add(fingerprint);
      newRows.push({ input, fingerprint });
    }
  }

  return { totalFound: rows.length, newRows, existingRows };
}
