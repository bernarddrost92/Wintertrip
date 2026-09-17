import { useState } from 'react';
import { Plus } from 'lucide-react';
import { GoldButton } from '../../components/GoldButton';
import { AddPlacementForm } from './AddPlacementForm';
import { PlacementRow } from './PlacementRow';
import { PlacementFilterBar } from './PlacementFilterBar';
import { countOpportunities } from '../../services/missionHuntAggregate';
import { classifyPlacement } from '../../services/missionHuntClassification';
import { placementMatchesFilter, type PlacementFilter } from '../../services/missionHuntOpportunity';
import { formatIsoDateReceipt } from '../../utils/dates';
import type { MissionHuntPlacement, NewPlacementInput } from '../../types/missionHunt';

interface MyPlacementsViewProps {
  displayName: string;
  placements: MissionHuntPlacement[];
  isVerified: boolean;
  verifiedAt: string | null;
  onAdd: (input: NewPlacementInput) => Promise<void> | void;
  onOpenPlacement: (id: string) => void;
  onVerify: () => Promise<void> | void;
}

/**
 * MY PLACEMENTS — landed on directly after login (spec section 34): the
 * homework block, the stat row, then the actual placements. Never a
 * team/admin screen first.
 */
export function MyPlacementsView({ displayName, placements, isVerified, verifiedAt, onAdd, onOpenPlacement, onVerify }: MyPlacementsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<PlacementFilter>('all-placements');
  const [verifying, setVerifying] = useState(false);

  const counts = countOpportunities(placements);
  const visible = placements.filter((p) => placementMatchesFilter(classifyPlacement(p.startDate, p.endDate, p.hoursPerWeek), filter));

  async function handleVerify() {
    setVerifying(true);
    await onVerify();
    setVerifying(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="border border-gold/20 bg-mission-raised p-4">
        <p className="label-classified text-gold/70">Voor vrijdag</p>
        <p className="mt-2 text-sm text-ink">
          Je plaatsingen staan al voor je klaar. Controleer of alles compleet en correct is. Mist er iets? Voeg de plaatsing direct toe. Klopt alles? Bevestig dat onderaan.
        </p>
      </div>

      <div>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-ink">{displayName}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Plaatsingen" value={counts.total} />
          <StatTile label="Verlengkansen" value={counts.verleng} tone="text-gold" />
          <StatTile label="Timingkansen" value={counts.timing} tone="text-status-go" />
          <StatTile label="Urenkansen" value={counts.urenkans} tone="text-sky-400" />
          <StatTile label="Double Opportunity" value={counts.double} tone="text-red-400" />
          <StatTile label="Geen directe kans" value={counts.grey} />
        </div>
      </div>

      {isVerified ? (
        <div className="flex items-center gap-2 border border-status-go/40 bg-status-go/5 px-4 py-3">
          <span className="text-status-go">✅</span>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-status-go">
            GECONTROLEERD{verifiedAt ? ` · ${formatIsoDateReceipt(verifiedAt.slice(0, 10))} · ${verifiedAt.slice(11, 16)}` : ''}
          </span>
        </div>
      ) : (
        <GoldButton type="button" onClick={handleVerify} disabled={verifying} className="w-full sm:w-auto">
          {verifying ? 'Bevestigen…' : 'ALLES KLOPT'}
        </GoldButton>
      )}

      <PlacementFilterBar value={filter} onChange={setFilter} />

      {showAddForm ? (
        <AddPlacementForm
          onAdd={async (input) => {
            await onAdd(input);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <GoldButton type="button" variant="ghost" icon={<Plus size={14} />} onClick={() => setShowAddForm(true)} className="self-start !px-3 !py-2 !text-xs">
          + Plaatsing toevoegen
        </GoldButton>
      )}

      <div>
        {visible.length === 0 ? (
          <p className="border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ink-muted">
            {placements.length === 0 ? 'Nog geen plaatsingen. Voeg er handmatig één toe, of wacht op de centrale import.' : 'Geen plaatsingen met deze kans.'}
          </p>
        ) : (
          visible.map((placement) => <PlacementRow key={placement.id} placement={placement} onOpen={() => onOpenPlacement(placement.id)} />)
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, tone = 'text-ink' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="border border-white/10 bg-mission-raised px-3 py-2.5">
      <p className={`font-display text-2xl font-bold ${tone}`}>{value}</p>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
    </div>
  );
}
