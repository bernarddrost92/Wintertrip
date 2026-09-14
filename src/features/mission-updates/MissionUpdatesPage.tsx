import { useState } from 'react';
import { PlayCircle, Radio } from 'lucide-react';
import { HudCorners } from '../../components/HudCorners';
import { TacticalGrid } from '../../components/TacticalGrid';
import { GoldButton } from '../../components/GoldButton';
import { formatIsoDateReceipt } from '../../utils/dates';
import { getSortedMissionUpdates, getTransmissionLabel, type MissionUpdate } from '../../data/missionUpdates';
import { MissionUpdatePlayer } from './MissionUpdatePlayer';

/**
 * The Mission Archive — a digital 007 intelligence archive, not a video
 * library. Newest transmission dominant up top, everything older logged
 * compactly below it. Both derive purely from missionUpdates.ts sorted by
 * date; adding a new update never requires touching this page.
 */
export function MissionUpdatesPage() {
  const sorted = getSortedMissionUpdates();
  const [latest, ...archive] = sorted;
  const [activeUpdate, setActiveUpdate] = useState<MissionUpdate | null>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <p className="label-classified text-gold/70">007 · Mission Archive</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">Mission Updates</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-ink-muted">Classified Communications · Team Zwolle</p>
      </header>

      {latest ? (
        <LatestTransmissionCard update={latest} onWatch={() => setActiveUpdate(latest)} />
      ) : (
        <div className="panel relative overflow-hidden px-6 py-10 text-center">
          <TacticalGrid className="opacity-15" />
          <p className="relative font-mono text-xs uppercase tracking-[0.25em] text-ink-muted">No transmissions logged yet</p>
        </div>
      )}

      <section>
        <p className="label-classified mb-3 text-gold/70">Mission Archive</p>
        <div className="panel divide-y divide-gold/10">
          {archive.length === 0 ? (
            <p className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim">
              No additional transmissions logged
            </p>
          ) : (
            archive.map((update) => (
              <button
                key={update.id}
                type="button"
                onClick={() => setActiveUpdate(update)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-gold/5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/70">{formatIsoDateReceipt(update.date)}</p>
                  <p className="mt-0.5 truncate font-display text-sm font-bold uppercase tracking-wide text-ink">{update.title}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                  {getTransmissionLabel(update, sorted)}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {activeUpdate && (
        <MissionUpdatePlayer
          update={activeUpdate}
          transmissionLabel={getTransmissionLabel(activeUpdate, sorted)}
          onClose={() => setActiveUpdate(null)}
        />
      )}
    </div>
  );
}

function LatestTransmissionCard({ update, onWatch }: { update: MissionUpdate; onWatch: () => void }) {
  return (
    <div className="panel relative overflow-hidden">
      <HudCorners />
      <TacticalGrid className="opacity-15" />
      <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-8">
        <div className="mx-auto w-full max-w-[220px] shrink-0 sm:mx-0">
          <TransmissionPoster update={update} onClick={onWatch} />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="label-classified text-gold">Latest Transmission</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted">{formatIsoDateReceipt(update.date)}</p>
          <p className="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-wide text-ink sm:text-3xl">{update.title}</p>
          {update.subtitle && <p className="mt-2 text-sm text-ink-muted">{update.subtitle}</p>}

          <GoldButton className="mt-6 w-full sm:w-auto" icon={<PlayCircle size={17} />} onClick={onWatch}>
            Watch Transmission
          </GoldButton>
        </div>
      </div>
    </div>
  );
}

/** The poster preview — a real (lazy-loaded) image when one exists, never
 * the video itself just to show a first frame. Falls back to a dark/gold
 * placeholder card if no poster is configured. */
function TransmissionPoster({ update, onClick }: { update: MissionUpdate; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block aspect-[9/16] w-full overflow-hidden border border-gold/25 bg-mission-raised"
    >
      {update.posterSrc ? (
        <img src={update.posterSrc} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
          <Radio className="text-gold/60" size={22} aria-hidden />
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold/70">Mission Update</p>
          <p className="font-display text-sm font-bold uppercase leading-tight text-ink">{update.title}</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
        <PlayCircle className="text-gold opacity-0 drop-shadow-[0_0_12px_rgba(0,0,0,0.8)] transition-opacity duration-200 group-hover:opacity-100" size={36} aria-hidden />
      </div>
      <span className="absolute bottom-1.5 left-0 right-0 text-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-gold/80">
        Play Transmission
      </span>
    </button>
  );
}
