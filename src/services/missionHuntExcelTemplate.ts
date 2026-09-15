import * as XLSX from 'xlsx';

export const TEMPLATE_FILENAME = 'Mission-Hunt-Projecten.xlsx';
export const TEMPLATE_SHEET_NAME = 'PROJECTEN';

/** Exact column order/labels the import parser recognizes — keep these two
 * files in lockstep (missionHuntExcelParse.ts's HEADER_TO_FIELD). */
export const TEMPLATE_HEADERS = [
  'Project',
  'Klant',
  'Professional',
  'Startdatum',
  'Einddatum',
  'Uren per week',
  'VCDB per maand',
  'Opmerking',
] as const;

const EXPLANATION_ROWS = [
  ['1. Vul al je projecten in.'],
  ['2. Één project per regel.'],
  ['3. Project en Klant zijn verplicht.'],
  ['4. Sla bestand op.'],
  ['5. Sleep bestand in Mission Hunt.'],
];

/** Pure and testable — no DOM, no download. buildTemplateWorkbookFile() /
 * the download button wraps this with the browser-only save step. */
export function buildTemplateWorkbook(): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const projectsSheet = XLSX.utils.aoa_to_sheet([[...TEMPLATE_HEADERS]]);
  projectsSheet['!cols'] = TEMPLATE_HEADERS.map((header) => ({ wch: Math.max(header.length + 4, 14) }));
  XLSX.utils.book_append_sheet(workbook, projectsSheet, TEMPLATE_SHEET_NAME);

  const explanationSheet = XLSX.utils.aoa_to_sheet(EXPLANATION_ROWS);
  explanationSheet['!cols'] = [{ wch: 48 }];
  XLSX.utils.book_append_sheet(workbook, explanationSheet, 'UITLEG');

  return workbook;
}

/** Browser-only: builds the workbook and saves it as a real .xlsx download. */
export function downloadTemplateWorkbook(): void {
  const workbook = buildTemplateWorkbook();
  XLSX.writeFile(workbook, TEMPLATE_FILENAME);
}
