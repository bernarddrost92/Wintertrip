import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, ClipboardPaste } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { downloadTemplateWorkbook } from '../../services/missionHuntExcelTemplate';
import { readWorkbookRowsFromFile } from '../../services/missionHuntWorkbook';
import { parseTabSeparatedText, parseTeamImportRows } from '../../services/missionHuntExcelParse';
import { buildTeamImportPreview, type ExistingPlacementForImport, type TeamImportPreview } from '../../services/missionHuntImportPreview';

interface TeamImportPanelProps {
  existingPlacements: readonly ExistingPlacementForImport[];
  onImport: (preview: TeamImportPreview) => Promise<{ ok: true; newCount: number; changedCount: number } | { ok: false; error: string }>;
}

type PanelState =
  | { phase: 'idle' }
  | { phase: 'pasting' }
  | { phase: 'error'; message: string }
  | { phase: 'preview'; preview: TeamImportPreview }
  | { phase: 'importing'; preview: TeamImportPreview }
  | { phase: 'done'; newCount: number; changedCount: number };

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

/**
 * TEAM PLACEMENT IMPORT — admin-only. Upload -> parse -> preview (NEW /
 * UNCHANGED / CHANGED / ERROR, plus which accountmanagers were recognized)
 * -> confirm -> import. Nothing is written to Supabase until CONFIRM
 * IMPORT — clicking it is the admin's explicit confirmation of every NEW
 * and CHANGED row shown; UNCHANGED rows and ERROR rows are never written.
 */
export function TeamImportPanel({ existingPlacements, onImport }: TeamImportPanelProps) {
  const [state, setState] = useState<PanelState>({ phase: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleParsedRows(aoa: unknown[][]) {
    const result = parseTeamImportRows(aoa);
    if (!result.ok) {
      if (result.reason === 'missing_headers') {
        setState({ phase: 'error', message: `Ontbrekende kolom(men): ${result.missing.join(', ')}. Gebruik de Excel-template.` });
      } else {
        setState({ phase: 'error', message: 'Geen plaatsingen gevonden in dit bestand.' });
      }
      return;
    }
    if (result.rows.length === 0) {
      setState({ phase: 'error', message: 'Geen plaatsingen gevonden in dit bestand.' });
      return;
    }
    const preview = buildTeamImportPreview(result.rows, existingPlacements);
    setState({ phase: 'preview', preview });
  }

  async function handleFile(file: File) {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setState({ phase: 'error', message: 'Bestandstype niet ondersteund. Gebruik .xlsx, .xls of .csv.' });
      return;
    }
    try {
      const rows = await readWorkbookRowsFromFile(file);
      handleParsedRows(rows);
    } catch {
      setState({ phase: 'error', message: 'Kon dit bestand niet lezen. Controleer of het een geldig Excel- of CSV-bestand is.' });
    }
  }

  function handlePasteSubmit() {
    if (pasteText.trim() === '') return;
    handleParsedRows(parseTabSeparatedText(pasteText));
    setPasteText('');
  }

  async function handleConfirmImport(preview: TeamImportPreview) {
    setState({ phase: 'importing', preview });
    const result = await onImport(preview);
    if (result.ok) {
      setState({ phase: 'done', newCount: result.newCount, changedCount: result.changedCount });
    } else {
      setState({ phase: 'error', message: result.error });
    }
  }

  function reset() {
    setState({ phase: 'idle' });
  }

  return (
    <div className="border border-gold/20 bg-mission-raised p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-classified">Team Placement Import</p>
        <GoldButton type="button" variant="ghost" icon={<Download size={14} />} onClick={downloadTemplateWorkbook} className="!px-3 !py-2 !text-xs">
          Download Excel Template
        </GoldButton>
      </div>

      {state.phase === 'idle' && (
        <div className="mt-3 flex flex-col gap-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-8 text-center transition-colors duration-150 ${
              dragOver ? 'border-gold bg-gold/5' : 'border-white/15 hover:border-gold/40'
            }`}
          >
            <FileSpreadsheet size={22} className="text-gold/70" aria-hidden />
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-ink">Drop Team Excel</p>
            <p className="text-xs text-ink-muted">Sleep het centrale bestand hierheen, of tik om te kiezen</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              aria-label="Kies teambestand"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setState({ phase: 'pasting' })}
            className="inline-flex items-center justify-center gap-1.5 border border-white/15 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-gold/40 hover:text-gold"
          >
            <ClipboardPaste size={13} aria-hidden />
            Paste From Excel
          </button>
        </div>
      )}

      {state.phase === 'pasting' && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            autoFocus
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text) {
                setPasteText(text);
                e.preventDefault();
                handleParsedRows(parseTabSeparatedText(text));
              }
            }}
            placeholder="Plak hier gekopieerde Excel-rijen (inclusief kopregel)…"
            rows={4}
            className="w-full border border-white/15 bg-mission-void px-3 py-2.5 text-xs text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none [color-scheme:dark]"
          />
          <div className="flex gap-2">
            <GoldButton type="button" onClick={handlePasteSubmit} className="!px-3 !py-2 !text-xs">
              Verwerken
            </GoldButton>
            <GoldButton type="button" variant="subtle" onClick={reset} className="!px-3 !py-2 !text-xs">
              Annuleren
            </GoldButton>
          </div>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="mt-3 flex flex-col gap-2 border border-red-400/30 bg-red-400/5 p-3">
          <p className="text-xs text-ink">{state.message}</p>
          <button type="button" onClick={reset} className="self-start text-xs font-semibold uppercase tracking-[0.1em] text-gold underline">
            Opnieuw proberen
          </button>
        </div>
      )}

      {(state.phase === 'preview' || state.phase === 'importing') && (
        <div className="mt-3 flex flex-col gap-3 border border-gold/20 bg-mission-void p-3">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-ink">
            {state.preview.totalFound} PLAATSINGEN GEVONDEN · {state.preview.accountManagers.length} ACCOUNTMANAGERS · {state.preview.talentManagers.length} TALENT MANAGERS ·{' '}
            {state.preview.talentManagerRelationCount} TM-KOPPELINGEN
          </p>
          <div className="flex flex-wrap gap-4 font-mono text-xs uppercase tracking-[0.08em]">
            <span className="text-status-go">{state.preview.newRows.length} NIEUW</span>
            <span className="text-ink-muted">{state.preview.unchangedRows.length} BESTAAND</span>
            <span className="text-gold">{state.preview.changedRows.length} GEWIJZIGD</span>
            <span className={state.preview.errorRows.length > 0 ? 'text-red-400' : 'text-ink-muted'}>{state.preview.errorRows.length} FOUTEN</span>
          </div>

          {state.preview.accountManagers.length > 0 && (
            <div className="border border-white/10 bg-mission-raised p-2.5">
              <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gold/70">Accountmanagers herkend</p>
              <div className="flex flex-col gap-0.5">
                {state.preview.accountManagers.map((am) => (
                  <p key={am.emailNormalized} className="text-xs text-ink">
                    {am.displayName} — {am.count}
                  </p>
                ))}
              </div>
            </div>
          )}

          {state.preview.talentManagers.length > 0 && (
            <div className="border border-white/10 bg-mission-raised p-2.5">
              <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gold/70">Talent Managers herkend</p>
              <div className="flex flex-col gap-0.5">
                {state.preview.talentManagers.map((tm) => (
                  <p key={tm.emailNormalized} className="text-xs text-ink">
                    {tm.displayName} — {tm.count}
                  </p>
                ))}
              </div>
            </div>
          )}

          {state.preview.changedRows.length > 0 && (
            <div className="border border-gold/20 bg-gold/5 p-2.5">
              <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gold">Gewijzigde plaatsingen — controleer voor bevestiging</p>
              <div className="flex flex-col gap-1">
                {state.preview.changedRows.map((row) => (
                  <p key={row.fingerprint} className="text-xs text-ink">
                    Rij {row.rowNumber} — {row.row.ownerDisplayName} — {row.row.professionalName} @ {row.row.clientName}: {row.changedFields.join(', ')} gewijzigd
                  </p>
                ))}
              </div>
            </div>
          )}

          {state.preview.errorRows.length > 0 && (
            <div className="border border-red-400/30 bg-red-400/5 p-2.5">
              <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-red-400">Fouten</p>
              <div className="flex flex-col gap-0.5">
                {state.preview.errorRows.map((error) => (
                  <p key={error.rowNumber} className="text-xs text-ink">
                    Rij {error.rowNumber}: {error.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <GoldButton
              type="button"
              disabled={state.phase === 'importing' || (state.preview.newRows.length === 0 && state.preview.changedRows.length === 0)}
              onClick={() => handleConfirmImport(state.preview)}
              className="!px-3 !py-2 !text-xs"
            >
              {state.phase === 'importing' ? 'Importeren…' : `Confirm Import (${state.preview.newRows.length + state.preview.changedRows.length})`}
            </GoldButton>
            <GoldButton type="button" variant="subtle" disabled={state.phase === 'importing'} onClick={reset} className="!px-3 !py-2 !text-xs">
              Annuleren
            </GoldButton>
          </div>
        </div>
      )}

      {state.phase === 'done' && (
        <div className="mt-3 flex items-center justify-between gap-3 border border-status-go/30 bg-status-go/5 p-3">
          <p className="text-xs text-ink">
            <span className="font-bold text-status-go">{state.newCount}</span> nieuw, <span className="font-bold text-gold">{state.changedCount}</span> gewijzigd geïmporteerd.
          </p>
          <button type="button" onClick={reset} className="text-xs font-semibold uppercase tracking-[0.1em] text-gold underline">
            Nieuwe import
          </button>
        </div>
      )}
    </div>
  );
}
