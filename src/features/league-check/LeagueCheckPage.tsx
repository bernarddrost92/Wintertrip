import { Sparkles } from 'lucide-react';
import { FormField, TextInput } from '../../components/FormField';
import { GoldButton } from '../../components/GoldButton';
import { LeagueCheckItem } from '../../components/LeagueCheckItem';
import { MissionStatus } from '../../components/MissionStatus';
import { SectionHeader } from '../../components/SectionHeader';
import { LEAGUE_CHECK_ITEMS, TEAM_AGREEMENTS } from '../../data/leagueCheckItems';
import { useLeagueCheck } from './useLeagueCheck';

export function LeagueCheckPage() {
  const { state, update, toggleItem, reset, checkedCount, total, missionApproved } = useLeagueCheck();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeader
        eyebrow="2 paar ogen principe"
        title="League Check"
        subtitle="2 paar ogen. 0 punten laten liggen."
      />

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
          <p className="label-classified">Checklist ({checkedCount}/{total})</p>
        </div>
        <ul className="space-y-2">
          {LEAGUE_CHECK_ITEMS.map((item) => (
            <LeagueCheckItem
              key={item.id}
              id={item.id}
              label={item.label}
              checked={Boolean(state.checkedItems[item.id])}
              onToggle={toggleItem}
            />
          ))}
        </ul>
      </div>

      <div
        className={`mt-8 flex flex-col items-center gap-3 border px-6 py-8 text-center transition-all duration-500 ${
          missionApproved ? 'border-gold bg-gold/5 shadow-gold-lg' : 'border-white/10 bg-mission-panel/50'
        }`}
      >
        {missionApproved && (
          <Sparkles className="animate-pulse-glow text-gold" size={28} aria-hidden />
        )}
        <MissionStatus kind={missionApproved ? 'approved' : 'review'} />
        <p className="max-w-sm text-sm text-ink-muted">
          {missionApproved
            ? 'Classified mission successfully cleared. Deze deal is klaar voor verwerking.'
            : 'Vink alle punten af en vul de velden in om deze deal vrij te geven.'}
        </p>
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
