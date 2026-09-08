/**
 * Marre's current Excel production snapshot, transcribed and anonymized.
 *
 * Deliberately excludes every professional and client name from the
 * original sheet — this file ships in the public GitHub Pages bundle, so
 * only the AM/TM codes, DB figures and a defensive date-quality flag per
 * row survive the transcription. Record ids are internal, anonymous
 * ("placement-001"…), not the real row order or any client reference.
 *
 * Two rows are flagged `dateQuality: 'needs_review'` from the source
 * sheet: one placement's start date was entered only as "sept" (no day or
 * year), and one placement's end date predates its own start date. Every
 * other row parses as a real calendar date, even though the sheet mixes
 * several date formats (D/M/Y, M/D/Y, 2- and 4-digit years) — that
 * inconsistency is a hygiene note for Marre, not something this snapshot
 * tries to silently normalize or guess at.
 */
import type { ProductionDataSource, ProductionRecord, ProductionSourceMeta } from '../../types/production';

const SNAPSHOT_DATE_LABEL = '08 SEP 2026';

export const MANUAL_SNAPSHOT_RECORDS: ProductionRecord[] = [
  { id: 'placement-001', accountManager: 'KS', talentManager: 'BVM', db: 16.5, dateQuality: 'ok' },
  { id: 'placement-002', accountManager: 'HH', talentManager: 'RP', db: 18, dateQuality: 'needs_review' },
  { id: 'placement-003', accountManager: 'LV', talentManager: 'YK', db: 12, dateQuality: 'ok' },
  { id: 'placement-004', accountManager: 'HH', talentManager: 'SM', db: 13, dateQuality: 'needs_review' },
  { id: 'placement-005', accountManager: 'KS', talentManager: null, db: 14, dateQuality: 'ok' },
  { id: 'placement-006', accountManager: 'JvD', talentManager: null, db: 18.5, dateQuality: 'ok' },
  { id: 'placement-007', accountManager: 'KS', talentManager: 'BVM', db: 14, dateQuality: 'ok' },
  { id: 'placement-008', accountManager: 'SB', talentManager: 'SM', db: null, dateQuality: 'ok' },
  { id: 'placement-009', accountManager: 'BD', talentManager: null, db: 23, dateQuality: 'ok' },
  { id: 'placement-010', accountManager: 'BD', talentManager: null, db: 15, dateQuality: 'ok' },
];

const MANUAL_SOURCE_META: ProductionSourceMeta = {
  dataSourceLabel: 'MARRE EXCEL',
  syncMode: 'MANUAL_SNAPSHOT',
  syncLabel: 'SNAPSHOT',
  syncValue: SNAPSHOT_DATE_LABEL,
};

/**
 * Today's data source: a hand-transcribed snapshot, not a live connection.
 * Once ICT/security clears a real Power Automate / API sync, replace this
 * with an ApiProductionDataSource implementing the same
 * ProductionDataSource interface — Mission Control itself needs no changes.
 */
export class ManualProductionDataSource implements ProductionDataSource {
  async getProductionData(): Promise<ProductionRecord[]> {
    return MANUAL_SNAPSHOT_RECORDS;
  }

  getSourceMeta(): ProductionSourceMeta {
    return MANUAL_SOURCE_META;
  }
}
