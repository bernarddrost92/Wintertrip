import * as XLSX from 'xlsx';

/**
 * Reads an .xlsx/.xls/.csv file's bytes into the same 2D array shape used
 * throughout Mission Hunt's import pipeline. SheetJS senses the actual
 * format from the file's content (not its extension), so one code path
 * covers all three — a mislabeled .csv that's secretly a real workbook (or
 * vice versa) still parses correctly.
 */
export function readWorkbookRows(data: ArrayBuffer): unknown[][] {
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' });
}

export function readWorkbookRowsFromFile(file: File): Promise<unknown[][]> {
  return file.arrayBuffer().then(readWorkbookRows);
}
