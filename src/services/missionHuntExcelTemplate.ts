import * as XLSX from 'xlsx';

export const TEMPLATE_FILENAME = 'Mission_Hunt_Team_Import_Template.xlsx';
export const TEMPLATE_SHEET_NAME = 'PLAATSINGEN';

/** Exact column order/labels the import parser recognizes as canonical —
 * keep this in lockstep with missionHuntExcelParse.ts's HEADER_TO_FIELD
 * (which additionally tolerates common variants of these same headers). */
export const TEMPLATE_HEADERS = [
  'Accountmanager',
  'E-mail accountmanager',
  'Professional',
  'Klant',
  'DB per maand',
  'Uren per week',
  'Startdatum',
  'Einddatum',
] as const;

const EXPLANATION_ROWS = [
  ['1. Één centraal bestand voor het hele team — niet per accountmanager.'],
  ['2. Één plaatsing per regel.'],
  ['3. Accountmanager, E-mail accountmanager, Professional, Klant, Startdatum en Einddatum zijn verplicht.'],
  ['4. Startdatum/Einddatum als datum (DD-MM-JJJJ) of Excel-datumcel.'],
  ['5. Sla bestand op.'],
  ['6. Upload bij TEAM PLACEMENT IMPORT (admin-only).'],
];

/** Pure and testable — no DOM, no download. downloadTemplateWorkbook()
 * wraps this with the browser-only save step. */
export function buildTemplateWorkbook(): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const placementsSheet = XLSX.utils.aoa_to_sheet([[...TEMPLATE_HEADERS]]);
  placementsSheet['!cols'] = TEMPLATE_HEADERS.map((header) => ({ wch: Math.max(header.length + 4, 14) }));
  XLSX.utils.book_append_sheet(workbook, placementsSheet, TEMPLATE_SHEET_NAME);

  const explanationSheet = XLSX.utils.aoa_to_sheet(EXPLANATION_ROWS);
  explanationSheet['!cols'] = [{ wch: 64 }];
  XLSX.utils.book_append_sheet(workbook, explanationSheet, 'UITLEG');

  return workbook;
}

/** Browser-only: builds the workbook and saves it as a real .xlsx download. */
export function downloadTemplateWorkbook(): void {
  const workbook = buildTemplateWorkbook();
  XLSX.writeFile(workbook, TEMPLATE_FILENAME);
}
