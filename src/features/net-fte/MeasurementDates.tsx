import { ArrowRight, CalendarCheck, CalendarClock } from 'lucide-react';
import { LEAGUE_PERIOD } from '../../config/leagueRules';
import { formatIsoDateNl, isoDateToday, toEpochDay } from '../../utils/dates';
import type { IsoDate } from '../../types/league';

interface MeasurementDatesProps {
  /** Injectable for tests; defaults to today. */
  today?: IsoDate;
}

/**
 * The two dates the Net FTE mission is measured on — the contractor FTE on
 * 1 Sep 2026 (start) against 31 Jan 2027 (meetdatum), straight from
 * LEAGUE_PERIOD — big and unmistakable, with the days still left.
 */
export function MeasurementDates({ today = isoDateToday() }: MeasurementDatesProps) {
  const daysLeft = toEpochDay(LEAGUE_PERIOD.end) - toEpochDay(today);

  return (
    <div className="grid items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div className="border border-white/15 bg-mission-panel px-4 py-3">
        <p className="label-classified flex items-center gap-1.5">
          <CalendarClock size={12} aria-hidden /> Startmeting
        </p>
        <p className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl">{formatIsoDateNl(LEAGUE_PERIOD.start)}</p>
        <p className="text-[13px] text-ink-muted">FTE van onze contractanten bij de start</p>
      </div>
      <div className="flex items-center justify-center text-gold" aria-hidden>
        <ArrowRight size={22} className="rotate-90 sm:rotate-0" />
      </div>
      <div className="border-2 border-gold/60 bg-gold/10 px-4 py-3">
        <p className="label-classified flex items-center gap-1.5 text-gold">
          <CalendarCheck size={12} aria-hidden /> Meetdatum
        </p>
        <p className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-gold sm:text-3xl">{formatIsoDateNl(LEAGUE_PERIOD.end)}</p>
        <p className="text-[13px] text-ink">
          {daysLeft > 0 ? (
            <>
              Nog <span className="font-semibold text-gold">{daysLeft} dagen</span> — dit is de FTE die telt
            </>
          ) : daysLeft === 0 ? (
            <span className="font-semibold text-gold">Vandaag wordt gemeten</span>
          ) : (
            'De meting is gedaan'
          )}
        </p>
      </div>
    </div>
  );
}
