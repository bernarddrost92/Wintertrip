import { Fragment, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import { LeagueCheckItem } from '../../components/LeagueCheckItem';
import { MissionCheckBlock } from '../../components/MissionCheckBlock';
import { SectionHeader } from '../../components/SectionHeader';
import { LEAGUE_CHECK_GROUPS, LEAGUE_CHECK_ITEMS, TEAM_AGREEMENTS } from '../../data/leagueCheckItems';
import { useMissionFlow } from '../missionFlow/missionFlowContext';
import { MissionReceiptFlow } from './MissionReceiptFlow';
import { RoleToggle } from './RoleToggle';
import { useLeagueCheck } from './useLeagueCheck';

const ITEMS_BY_ID = Object.fromEntries(LEAGUE_CHECK_ITEMS.map((item) => [item.id, item]));

const MISSION_TYPE_LABEL_NL = { NEW_PLACEMENT: 'Nieuwe plaatsing', EXTENSION: 'Verlenging', HOURS_INCREASE: 'Urenuitbreiding' } as const;

function bareCode(code: string): string {
  return code.replace(/^\d+\s*/, '');
}

export function LeagueCheckPage() {
  const { beforeCheck, agent, updateAgent, resetAgent, clearBeforeCheck } = useMissionFlow();
  const { state, update, toggleItem, reset, checkedCount, total, missionApproved } = useLeagueCheck();
  const openItems = LEAGUE_CHECK_ITEMS.filter((item) => !state.checkedItems[item.id]);
  /** Bumped on New Mission so MissionReceiptFlow — which owns its own local
   * "receipt generated" / after-check-editor state — remounts clean rather
   * than carrying a stale receipt from the previous mission. */
  const [resetKey, setResetKey] = useState(0);

  function handleNewMission() {
    reset();
    clearBeforeCheck();
    resetAgent();
    setResetKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeader eyebrow="2 paar ogen principe" title="League Check" subtitle="2 paar ogen. 0 punten laten liggen." />

      {beforeCheck && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border border-gold/15 bg-mission-panel px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          <span className="text-gold/80">Vanuit Calculator</span>
          <span>{MISSION_TYPE_LABEL_NL[beforeCheck.form.missionType]}</span>
          <span>Base <span className="text-ink">{beforeCheck.result.baseScore.toLocaleString('nl-NL', { maximumFractionDigits: 2 })}</span></span>
          <span>Factor <span className="text-ink">{beforeCheck.form.factor.toLocaleString('nl-NL')}x</span></span>
          <span>Mission Value <span className="text-gold">{beforeCheck.result.finalScore.toLocaleString('nl-NL', { maximumFractionDigits: 2 })}</span></span>
        </div>
      )}

      {/* Identity block — who is running this check, and for which professional.
          Kept in the shared Mission Flow context so it survives all the way
          through After Check, the Mission Receipt, and its download/share.
          League Check works fully standalone here too: nothing below requires
          having come from the Calculator first. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <FormField id="agentName" label="Agent">
          <TextInput
            id="agentName"
            value={agent.agentName}
            onChange={(e) => updateAgent('agentName', e.target.value)}
            placeholder="Naam"
          />
        </FormField>
        <div>
          <p className="label-classified mb-1.5">Role</p>
          <RoleToggle value={agent.agentRole} onChange={(role) => updateAgent('agentRole', role)} />
        </div>
        <FormField id="professionalName" label="Professional">
          <TextInput
            id="professionalName"
            value={agent.professionalName}
            onChange={(e) => updateAgent('professionalName', e.target.value)}
            placeholder="Naam professional"
          />
        </FormField>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField id="checkDate" label="Datum check">
          <TextInput id="checkDate" type="date" value={state.checkDate} onChange={(e) => update('checkDate', e.target.value)} />
        </FormField>
        <FormField id="reviewer" label="Reviewer / tweede paar ogen">
          <TextInput id="reviewer" value={state.reviewer} onChange={(e) => update('reviewer', e.target.value)} placeholder="Naam reviewer" />
        </FormField>
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="label-classified">Mission check</p>
          <span className={`font-mono text-xs font-semibold tracking-wider ${missionApproved ? 'text-gold' : 'text-ink-muted'}`}>
            {checkedCount} / {total}
          </span>
        </div>

        {/* Compact progress rail — one waypoint per check, lit as each clears. */}
        <div className="mb-6 flex items-center border border-gold/10 bg-mission-panel px-4 py-2.5">
          {LEAGUE_CHECK_ITEMS.map((item, i) => {
            const done = Boolean(state.checkedItems[item.id]);
            return (
              <Fragment key={item.id}>
                {i > 0 && <div className={`h-px flex-1 ${done && state.checkedItems[LEAGUE_CHECK_ITEMS[i - 1].id] ? 'bg-gold/60' : 'bg-white/10'}`} />}
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${done ? 'bg-gold shadow-gold' : 'bg-white/15'}`} aria-hidden />
              </Fragment>
            );
          })}
        </div>

        <div className="space-y-4">
          {LEAGUE_CHECK_GROUPS.map((group) => (
            <MissionCheckBlock key={group.label} label={group.label}>
              {group.itemIds.map((id) => {
                const item = ITEMS_BY_ID[id];
                return (
                  <LeagueCheckItem key={id} id={item.id} code={item.code} label={item.label} checked={Boolean(state.checkedItems[id])} onToggle={toggleItem} />
                );
              })}
            </MissionCheckBlock>
          ))}
        </div>
      </div>

      {/* Status hero — 6/6 only changes what this shows, it never blocks the
          receipt flow below. Below 6/6 it names exactly which checks are
          still open rather than guessing at what they might be worth. */}
      <div
        className={`relative mt-8 flex flex-col items-center gap-3 overflow-hidden border px-6 py-8 text-center transition-all duration-500 ${
          missionApproved ? 'animate-rise-in border-gold bg-gold/5 shadow-gold-lg' : 'border-white/10 bg-mission-panel/50'
        }`}
      >
        {missionApproved ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gold-sweep bg-[length:200%_auto] animate-gold-sweep-move" aria-hidden />
            <Sparkles className="animate-pulse-glow text-gold" size={28} aria-hidden />
            <p className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-gold">Mission Approved</p>
            <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.22em] text-gold/80">
              <span>2 Paar Ogen</span>
              <span className="text-gold/30">|</span>
              <span>0 Punten Laten Liggen</span>
            </div>
          </>
        ) : (
          <>
            <p className="label-classified text-ink-muted">Open Opportunities</p>
            <p className="font-display text-4xl font-bold tabular-nums text-gold">{openItems.length}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
              {openItems.map((item) => (
                <span key={item.id} className="flex items-center gap-1.5">
                  <span className="text-ink-muted">○</span>
                  {bareCode(item.code)}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">Hier kan nog winst liggen</p>
          </>
        )}
      </div>

      <MissionReceiptFlow key={resetKey} beforeCheck={beforeCheck} agent={agent} checkedItems={state.checkedItems} checkedCount={checkedCount} total={total} />

      <div className="mt-6 flex justify-end">
        <GoldButton variant="ghost" onClick={handleNewMission}>
          New Mission
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
