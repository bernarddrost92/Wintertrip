import { describe, expect, it } from 'vitest';
import { buildImportPreview } from './missionHuntImportPreview';
import { buildProjectFingerprint } from './missionHuntFingerprint';
import type { NewProjectInput } from '../types/missionHunt';

function row(overrides: Partial<NewProjectInput> = {}): NewProjectInput {
  return { projectName: 'De Meerwaarde', clientName: 'Han', ...overrides };
}

describe('buildImportPreview', () => {
  it('classifies every row as new when there are no existing fingerprints', () => {
    const rows = [row(), row({ projectName: 'Greijdanus', clientName: 'Ryan' })];
    const preview = buildImportPreview(rows, 'owner-1', new Set());
    expect(preview.totalFound).toBe(2);
    expect(preview.newRows).toHaveLength(2);
    expect(preview.existingRows).toHaveLength(0);
  });

  it('classifies a row matching an existing fingerprint as already-existing', () => {
    const existing = new Set([buildProjectFingerprint('owner-1', 'De Meerwaarde', 'Han', null)]);
    const preview = buildImportPreview([row()], 'owner-1', existing);
    expect(preview.newRows).toHaveLength(0);
    expect(preview.existingRows).toHaveLength(1);
  });

  it('dedupes identical rows within the same import batch (same fingerprint twice)', () => {
    const rows = [row(), row()];
    const preview = buildImportPreview(rows, 'owner-1', new Set());
    expect(preview.newRows).toHaveLength(1);
    expect(preview.existingRows).toHaveLength(1);
  });

  it('a re-import of the same file produces zero new rows', () => {
    const rows = [row(), row({ projectName: 'Greijdanus', clientName: 'Ryan' })];
    const firstPass = buildImportPreview(rows, 'owner-1', new Set());
    const existingAfterFirstImport = new Set(firstPass.newRows.map((r) => r.fingerprint));

    const secondPass = buildImportPreview(rows, 'owner-1', existingAfterFirstImport);
    expect(secondPass.newRows).toHaveLength(0);
    expect(secondPass.existingRows).toHaveLength(2);
  });
});
