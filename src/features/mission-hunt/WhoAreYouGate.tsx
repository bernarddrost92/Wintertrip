import { useMemo, useState } from 'react';
import { GoldButton } from '../../components/GoldButton';
import { FormField, TextInput } from '../../components/FormField';
import type { MissionHuntProfile } from '../../types/missionHunt';

interface WhoAreYouGateProps {
  profiles: MissionHuntProfile[];
  onContinue: (profileId: string) => void;
}

/**
 * Mission Hunt's only remaining "sign-in" step, and deliberately not
 * authentication: everyone on Team Zwolle is trusted, so this is a name
 * picker, not a login form. No password, no per-person PIN, no warning —
 * picking a name and clicking DOORGAAN is the entire flow. The choice is
 * remembered on this device (personStorage.ts) so it only happens once,
 * until WISSEL PERSOON is used.
 */
export function WhoAreYouGate({ profiles, onContinue }: WhoAreYouGateProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return profiles;
    return profiles.filter((p) => p.displayName.toLowerCase().includes(normalized));
  }, [profiles, query]);

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    onContinue(selectedId);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="label-classified text-center text-gold/70">Mission Hunt</p>
      <h1 className="mt-4 text-center font-display text-2xl font-bold uppercase tracking-wide text-ink">Wie ben jij?</h1>
      <p className="mt-3 text-center text-sm text-ink-muted">Selecteer je eigen naam om verder te gaan.</p>

      <form onSubmit={handleContinue} className="mt-8 flex flex-col gap-3">
        <FormField id="mh-person-search" label="Zoek je naam">
          <TextInput
            id="mh-person-search"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Naam…"
          />
        </FormField>

        <ul className="max-h-72 divide-y divide-white/10 overflow-y-auto border border-white/10">
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
          Doorgaan
        </GoldButton>
      </form>
    </div>
  );
}
