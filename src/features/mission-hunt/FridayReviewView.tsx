import { useState } from 'react';
import { buildAccountManagerSummaries, countOpportunities, teamCompletion } from '../../services/missionHuntAggregate';
import { AccountManagerSummaryCard } from './AccountManagerSummaryCard';
import { AccountManagerDrawer } from './AccountManagerDrawer';
import { PlacementFilterBar } from './PlacementFilterBar';
import type { PlacementFilter } from '../../services/missionHuntOpportunity';
import type { MissionHuntPlacement, MissionHuntProfile, PlacementReview, TeamMember } from '../../types/missionHunt';

interface FridayReviewViewProps {
  placements: MissionHuntPlacement[];
  profiles: MissionHuntProfile[];
  teamMembers: TeamMember[];
  placementReviews: PlacementReview[];
  onOpenPlacement: (placementId: string) => void;
}

/**
 * FRIDAY REVIEW — Bernard's/admin's Friday-meeting screen. Deliberately
 * just summaries at the top level: professional/client names never appear
 * here, only after clicking into a person's card (spec section 39/40).
 */
export function FridayReviewView({ placements, profiles, teamMembers, placementReviews, onOpenPlacement }: FridayReviewViewProps) {
  const [filter, setFilter] = useState<PlacementFilter>('all-opportunities');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const summaries = buildAccountManagerSummaries(placements, profiles, teamMembers, placementReviews);
  const totals = countOpportunities(placements);
  const completion = teamCompletion(summaries);

  const selectedIndex = selectedEmail ? summaries.findIndex((s) => s.emailNormalized === selectedEmail) : -1;
  const selectedSummary = selectedIndex >= 0 ? summaries[selectedIndex] : null;

  function goToOffset(offset: number) {
    if (selectedIndex < 0 || summaries.length === 0) return;
    const nextIndex = (selectedIndex + offset + summaries.length) % summaries.length;
    setSelectedEmail(summaries[nextIndex].emailNormalized);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="label-classified text-gold/70">Team Zwolle</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TotalTile label="Plaatsingen" value={totals.total} />
          <TotalTile label="Verlengkansen" value={totals.verleng} tone="text-gold" />
          <TotalTile label="Timingkansen" value={totals.timing} tone="text-status-go" />
          <TotalTile label="Double Opportunities" value={totals.double} tone="text-red-400" />
        </div>
        <div className="mt-3 border border-white/10 bg-mission-raised px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink">
          TEAM CHECK: {completion.verifiedCount} / {completion.totalCount} ACCOUNTMANAGERS GECONTROLEERD
        </div>
      </div>

      <PlacementFilterBar value={filter} onChange={setFilter} />

      {summaries.length === 0 ? (
        <p className="border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ink-muted">Nog geen plaatsingen geïmporteerd.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <AccountManagerSummaryCard key={summary.emailNormalized} summary={summary} onClick={() => setSelectedEmail(summary.emailNormalized)} />
          ))}
        </div>
      )}

      {selectedSummary && (
        <AccountManagerDrawer
          summary={selectedSummary}
          initialFilter={filter}
          onClose={() => setSelectedEmail(null)}
          onOpenPlacement={onOpenPlacement}
          onNext={summaries.length > 1 ? () => goToOffset(1) : undefined}
          onPrevious={summaries.length > 1 ? () => goToOffset(-1) : undefined}
        />
      )}
    </div>
  );
}

function TotalTile({ label, value, tone = 'text-ink' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="border border-white/10 bg-mission-raised px-3 py-2.5">
      <p className={`font-display text-2xl font-bold ${tone}`}>{value}</p>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
    </div>
  );
}
