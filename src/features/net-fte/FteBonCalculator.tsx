import { useMemo, useState } from 'react';
import { Plus, Ticket } from 'lucide-react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import { StandBadge } from '../../components/StandBadge';
import { OWN_TEAM, type PowerBiStandingRow } from '../../data/manualPowerBiSnapshot';
import { FTE_BON_TYPES, type FteBonType, type NewFteBon } from '../../services/fteBonnen';
import { projectStandings } from '../../services/netFteProjection';
import { formatSignedFte, formatVcdbValue } from '../../utils/format';
import { parseDutchNumber } from '../../utils/parseDutchNumber';
import type { FteBonnenStatus } from '../../hooks/useFteBonnen';
import { ProjectionReadout } from './ProjectionReadout';

const QUICK_FTE = [0.2, 0.5, 0.8, 1.0];
const MAX_ABS_FTE = 50;

interface FteBonCalculatorProps {
  standings: PowerBiStandingRow[];
  openFte: number;
  storeStatus: FteBonnenStatus;
  saving: boolean;
  onSave: (bon: NewFteBon) => Promise<boolean>;
}

function toFteInput(value: number): string {
  return value.toLocaleString('nl-NL', { maximumFractionDigits: 2 });
}

/**
 * The FTE Bon Calculator — type an FTE change, see straight away what it
 * does to Zwolle's Net FTE, ranking, factor and Final Score (official +
 * this bon). Only the FTE number is needed for the result; a label is only
 * needed to save it to the shared open-bonnen list.
 */
export function FteBonCalculator({ standings, openFte, storeStatus, saving, onSave }: FteBonCalculatorProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FteBonType>('VERLENGING');
  const [fteRaw, setFteRaw] = useState('');
  const [owner, setOwner] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const parsed = parseDutchNumber(fteRaw);
  /** null unless the input is a usable, non-zero FTE change. */
  const fte = parsed !== null && parsed !== 0 && Math.abs(parsed) <= MAX_ABS_FTE ? parsed : null;
  const fteValid = fte !== null;

  const withBon = useMemo(() => (fte !== null ? projectStandings(standings, OWN_TEAM, fte) : null), [standings, fte]);
  const withAllOpen = useMemo(
    () => (fte !== null && openFte !== 0 ? projectStandings(standings, OWN_TEAM, openFte + fte) : null),
    [standings, fte, openFte],
  );

  const canSave = fteValid && label.trim() !== '' && storeStatus !== 'unavailable' && !saving;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || fte === null) return;
    const ok = await onSave({ label, type, fteDelta: fte, owner, note });
    if (ok) {
      setMessage({ tone: 'ok', text: `Bon opgeslagen: ${label.trim()} · ${formatSignedFte(fte)} FTE` });
      setLabel('');
      setFteRaw('');
      setOwner('');
      setNote('');
    } else {
      setMessage({ tone: 'error', text: 'Opslaan lukte niet. Probeer het opnieuw.' });
    }
  }

  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="fte-bon-calculator">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ticket size={18} className="text-gold" aria-hidden />
          <h2 id="fte-bon-calculator" className="font-display text-2xl font-black uppercase tracking-tight text-ink">
            FTE Bon Calculator
          </h2>
        </div>
        <p className="text-xs text-ink-muted">Vul de FTE-groei in — het effect staat er direct.</p>
      </div>

      <form onSubmit={handleSave} className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4">
          <div>
            <p className="label-classified mb-1.5">Type actie</p>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Type actie">
              {FTE_BON_TYPES.map((option) => {
                const active = option.value === type;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setType(option.value)}
                    className={`border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      active ? 'border-gold bg-gold/15 text-gold' : 'border-white/15 text-ink-muted hover:border-gold/40 hover:text-ink'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <FormField id="fte-bon-fte" label="Groei in FTE" hint="Bijv. 0,8 voor 32 uur. Negatief mag (bijv. uitstroom).">
            <TextInput
              id="fte-bon-fte"
              inputMode="decimal"
              autoComplete="off"
              value={fteRaw}
              onChange={(e) => {
                setFteRaw(e.target.value);
                setMessage(null);
              }}
              placeholder="0,0"
              className="text-lg font-semibold tabular-nums"
            />
          </FormField>
          <div className="-mt-2 flex flex-wrap gap-1.5">
            {QUICK_FTE.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFteRaw(toFteInput(value))}
                className="border border-white/15 px-2.5 py-1 font-mono text-xs text-ink-muted transition-colors hover:border-gold/50 hover:text-gold"
              >
                +{toFteInput(value)}
              </button>
            ))}
          </div>

          <FormField id="fte-bon-label" label="Naam / label">
            <TextInput
              id="fte-bon-label"
              autoComplete="off"
              maxLength={80}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Initialen professional of korte omschrijving"
            />
          </FormField>

          <details className="group border border-white/10 px-3 py-2">
            <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted group-open:text-gold">
              Meer: AM/TM en notitie (optioneel)
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <FormField id="fte-bon-owner" label="Verantwoordelijke AM/TM">
                <TextInput id="fte-bon-owner" maxLength={40} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Initialen" />
              </FormField>
              <FormField id="fte-bon-note" label="Notitie">
                <TextInput id="fte-bon-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bijv. start 1 nov" />
              </FormField>
            </div>
          </details>

          <GoldButton type="submit" disabled={!canSave} icon={<Plus size={16} />} className="w-full">
            {saving ? 'Opslaan…' : 'Bon opslaan'}
          </GoldButton>
          {storeStatus === 'unavailable' && (
            <p className="text-xs text-ink-muted">Opslaan is nu niet beschikbaar — de berekening werkt wel.</p>
          )}
          {fteValid && label.trim() === '' && storeStatus !== 'unavailable' && <p className="text-xs text-ink-muted">Geef de bon een label om hem op te slaan.</p>}
          {message && (
            <p role="status" className={`text-sm font-semibold ${message.tone === 'ok' ? 'text-status-go' : 'text-red-300'}`}>
              {message.text}
            </p>
          )}
        </div>

        <div className="space-y-4 border-t border-white/10 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <StandBadge kind="projection" detail="officieel + deze bon" />
          </div>
          {withBon ? (
            <>
              <ProjectionReadout projection={withBon} />
              {withAllOpen && (
                <p className="border-t border-white/10 pt-3 text-sm text-ink-muted">
                  Met alle open bonnen ({formatSignedFte(openFte)}) erbij:{' '}
                  <span className="font-semibold text-intel">
                    {formatVcdbValue(withAllOpen.own.netFte)} · FTE #{withAllOpen.own.netFteRanking} · positie #{withAllOpen.own.finalRanking}
                  </span>
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full min-h-[140px] items-center justify-center border border-dashed border-white/15 px-4 text-center text-sm text-ink-muted">
              {fteRaw.trim() !== '' && !fteValid ? `Vul een FTE tussen −${MAX_ABS_FTE} en ${MAX_ABS_FTE} in (niet 0).` : 'Vul de FTE-groei in om de nieuwe stand te zien.'}
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
