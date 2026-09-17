import { useState } from 'react';
import { GoldButton } from '../../components/GoldButton';
import { PlacementRow } from './PlacementRow';
import { PlacementFilterBar } from './PlacementFilterBar';
import { classifyPlacement } from '../../services/missionHuntClassification';
import { placementMatchesFilter, type PlacementFilter } from '../../services/missionHuntOpportunity';
import { formatIsoDateReceipt } from '../../utils/dates';
import type { TalentManagerSummary } from '../../services/missionHuntAggregate';

interface MyProfessionalsViewProps {
  displayName: string;
  summary: TalentManagerSummary | null;
  isVerified: boolean;
  verifiedAt: string | null;
  onOpenPlacement: (id: string) => void;
  onVerify: () => Promise<void> | void;
}

/**
 * MIJN PROFESSIONALS — a Talent Manager's own landing view: every
 * placement they're linked to, across however many Accountmanagers, grouped
 * by AM for the cross-pollination picture. Purely additive: "My Placements"
 * (the AM view) stays the unconditional default tab and this never replaces
 * it — a person who is both AM and TM sees both.
 */
export function MyProfessionalsView({ displayName, summary, isVerified, verifiedAt, onOpenPlacement, onVerify }: MyProfessionalsViewProps) {
  const [filter, setFilter] = useState<PlacementFilter>('all-placements');
  const [verifying, setVerifying] = useState(false);

  const counts = summary?.counts ?? { total: 0, verleng: 0, timing: 0, double: 0, urenkans: 0, grey: 0 };
  const accountManagers = summary?.accountManagers ?? [];

  async function handleVerify() {
    setVerifying(true);
    await onVerify();
    setVerifying(false);
  }

  const groups = accountManagers
    .map((group) => ({ ...group, placements: group.placements.filter((p) => placementMatchesFilter(classifyPlacement(p.startDate, p.endDate, p.hoursPerWeek), filter)) }))
    .filter((group) => group.placements.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="border border-gold/20 bg-mission-raised p-4">
        <p className="label-classified text-gold/70">Mijn Professionals</p>
        <p className="mt-2 text-sm text-ink">
          Dit zijn de plaatsingen waaraan jij als Talent Manager gekoppeld bent, over alle accountmanagers heen. Controleer of alles compleet en correct is. Klopt
          alles? Bevestig dat onderaan.
        </p>
      </div>

      <div>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-ink">{displayName}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile label="Plaatsingen" value={counts.total} />
          <StatTile label="Accountmanagers" value={accountManagers.length} />
          <StatTile label="Verlengkansen" value={counts.verleng} tone="text-gold" />
          <StatTile label="Timingkansen" value={counts.timing} tone="text-status-go" />
          <StatTile label="Double Opportunity" value={counts.double} tone="text-red-400" />
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

      <div>
        {groups.length === 0 ? (
          <p className="border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ink-muted">
            {counts.total === 0 ? 'Nog geen plaatsingen aan jou gekoppeld als Talent Manager.' : 'Geen plaatsingen met deze kans.'}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.emailNormalized} className="mb-4">
              <p className="mb-1.5 mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-gold/80">
                {group.displayName} — {group.placements.length}
              </p>
              {group.placements.map((placement) => (
                <PlacementRow key={placement.id} placement={placement} onOpen={() => onOpenPlacement(placement.id)} />
              ))}
            </div>
          ))
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
