import { useMemo, useState } from 'react';
import { GoldButton } from '../../components/GoldButton';
import { FormField, TextInput } from '../../components/FormField';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { useMissionHuntRoster } from '../mission-hunt/useMissionHuntRoster';

interface ReceiptPersonPickerProps {
  /** Remembers the chosen profile on this device and registers the
   * already-generated receipt under it. */
  onSelect: (profileId: string) => void;
}

/**
 * The WIE BEN JIJ? name picker, now living in League Check since Mission
 * Hunt (where it used to be) is no longer part of the site. Shown only once
 * a receipt has been generated while nobody has selected a name yet on
 * this device — the receipt itself already printed above this, unaffected
 * either way. Same trust model as before: a name picker, not a login.
 */
export function ReceiptPersonPicker({ onSelect }: ReceiptPersonPickerProps) {
  return (
    <div className="panel space-y-4 p-5 sm:p-6">
      <p className="text-center font-mono text-[10px] uppercase tracking-wider text-ink-dim">
        Nog geen naam gekozen — receipt nog niet team-breed geregistreerd. Kies je naam om mee te tellen in League Check Intelligence.
      </p>
      {isSupabaseConfigured() && <RosterPicker onSelect={onSelect} />}
    </div>
  );
}

function RosterPicker({ onSelect }: ReceiptPersonPickerProps) {
  const roster = useMissionHuntRoster();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return roster.profiles;
    return roster.profiles.filter((p) => p.displayName.toLowerCase().includes(normalized));
  }, [roster.profiles, query]);

  if (roster.loading || roster.error || roster.profiles.length === 0) return null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    onSelect(selectedId);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3">
      <p className="text-center font-display text-lg font-bold uppercase tracking-wide text-ink">Wie ben jij?</p>
      <FormField id="lc-person-search" label="Zoek je naam">
        <TextInput
          id="lc-person-search"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Naam…"
        />
      </FormField>

      <ul className="max-h-60 divide-y divide-white/10 overflow-y-auto border border-white/10">
        {filtered.length === 0 && <li className="px-3 py-3 text-center text-sm text-ink-muted">Geen namen gevonden.</li>}
        {filtered.map((p) => {
          const active = p.id === selectedId;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                aria-pressed={active}
                className={`block w-full px-3 py-2.5 text-left text-sm transition-colors ${
                  active ? 'bg-gold/15 text-gold' : 'text-ink hover:bg-white/5'
                }`}
              >
                {p.displayName}
              </button>
            </li>
          );
        })}
      </ul>

      <GoldButton type="submit" disabled={!selectedId}>
        Registreer receipt
      </GoldButton>
    </form>
  );
}
