import { Fragment } from 'react';
import { Sparkles } from 'lucide-react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import { LeagueCheckItem } from '../../components/LeagueCheckItem';
import { SectionHeader } from '../../components/SectionHeader';
import { LEAGUE_CHECK_ITEMS, TEAM_AGREEMENTS } from '../../data/leagueCheckItems';
import { useLeagueCheck } from './useLeagueCheck';

export function LeagueCheckPage() {
  const { state, update, toggleItem, reset, checkedCount, total, missionApproved } = useLeagueCheck();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeader eyebrow="2 paar ogen principe" title="League Check" subtitle="2 paar ogen. 0 punten laten liggen." />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <FormField id="professional" label="Professional / dealnaam">
          <TextInput
            id="professional"
            value={state.professional}
            onChange={(e) => update('professional', e.target.value)}
            placeholder="Bijv. Professional 03 — Salland Techniek"
          />
        </FormField>
        <FormField id="checkDate" label="Datum check">
          <TextInput id="checkDate" type="date" value={state.checkDate} onChange={(e) => update('checkDate', e.target.value)} />
        </FormField>
        <FormField id="lc-am" label="Accountmanager">
          <TextInput id="lc-am" value={state.accountManager} onChange={(e) => update('accountManager', e.target.value)} placeholder="Naam accountmanager" />
        </FormField>
        <FormField id="reviewer" label="Reviewer / tweede paar ogen">
          <TextInput id="reviewer" value={state.reviewer} onChange={(e) => update('reviewer', e.target.value)} placeholder="Naam reviewer" />
        </FormField>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="label-classified">Mission check</p>
          <span className={`font-mono text-xs font-semibold tracking-wider ${missionApproved ? 'text-gold' : 'text-ink-muted'}`}>
            {checkedCount} / {total}
          </span>
        </div>

        {/* Compact progress rail — ten waypoints, lit as each item clears. */}
        <div className="mb-4 flex items-center border border-gold/10 bg-mission-panel px-4 py-2.5">
          {LEAGUE_CHECK_ITEMS.map((item, i) => {
            const done = Boolean(state.checkedItems[item.id]);
            return (
              <Fragment key={item.id}>
                {i > 0 && <div className={`h-px flex-1 ${done && state.checkedItems[LEAGUE_CHECK_ITEMS[i - 1].id] ? 'bg-gold/60' : 'bg-white/10'}`} />}
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${done ? 'bg-gold shadow-gold' : 'bg-white/15'}`}
                  aria-hidden
                />
              </Fragment>
            );
          })}
        </div>

        <ul className="border border-gold/10 bg-mission-panel">
          {LEAGUE_CHECK_ITEMS.map((item) => (
            <LeagueCheckItem key={item.id} id={item.id} code={item.code} label={item.label} checked={Boolean(state.checkedItems[item.id])} onToggle={toggleItem} />
          ))}
        </ul>
      </div>

      <div
        className={`relative mt-8 flex flex-col items-center gap-3 overflow-hidden border px-6 py-8 text-center transition-all duration-500 ${
          missionApproved ? 'animate-rise-in border-gold bg-gold/5 shadow-gold-lg' : 'border-white/10 bg-mission-panel/50'
        }`}
      >
        {missionApproved && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gold-sweep bg-[length:200%_auto] animate-gold-sweep-move" aria-hidden />
            <Sparkles className="animate-pulse-glow text-gold" size={28} aria-hidden />
          </>
        )}
        <p className={`font-display text-2xl font-bold uppercase tracking-[0.08em] ${missionApproved ? 'text-gold' : 'text-ink-dim'}`}>
          {missionApproved ? 'Mission Approved' : 'Review Required'}
        </p>
        {missionApproved ? (
          <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-gold/80">
            <span>2 Paar Ogen</span>
            <span className="text-gold/30">|</span>
            <span>0 Punten Laten Liggen</span>
          </div>
        ) : (
          <p className="max-w-sm text-sm text-ink-muted">Vink alle punten af en vul de velden in om deze deal vrij te geven.</p>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <GoldButton variant="ghost" onClick={reset}>
          Reset check
        </GoldButton>
      </div>

      <div className="panel mt-10 p-5 sm:p-6">
        <SectionHeader eyebrow="Teamafspraken" title="Waar we elkaar op scherp houden" />
        <ul className="mt-4 space-y-2">
          {TEAM_AGREEMENTS.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-sm text-ink">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
