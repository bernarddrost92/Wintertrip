import { useState } from 'react';
import {
  buildAccountManagerSummaries,
  buildCrossIntelligence,
  buildTalentManagerSummaries,
  countOpportunities,
  talentManagerTeamCompletion,
  teamCompletion,
} from '../../services/missionHuntAggregate';
import { AccountManagerSummaryCard } from './AccountManagerSummaryCard';
import { AccountManagerDrawer } from './AccountManagerDrawer';
import { TalentManagerSummaryCard } from './TalentManagerSummaryCard';
import { TalentManagerDrawer } from './TalentManagerDrawer';
import { PlacementFilterBar } from './PlacementFilterBar';
import type { PlacementFilter } from '../../services/missionHuntOpportunity';
import type { MissionHuntPlacement, MissionHuntProfile, PlacementReview, TalentManagerLink, TalentManagerReview, TeamMember } from '../../types/missionHunt';

interface FridayReviewViewProps {
  placements: MissionHuntPlacement[];
  profiles: MissionHuntProfile[];
  teamMembers: TeamMember[];
  placementReviews: PlacementReview[];
  talentManagerLinks: TalentManagerLink[];
  talentManagerReviews: TalentManagerReview[];
  onOpenPlacement: (placementId: string) => void;
}

/**
 * FRIDAY REVIEW — Bernard's/admin's Friday-meeting screen. Deliberately
 * just summaries at the top level: professional/client names never appear
 * here, only after clicking into a person's card. Two clearly separate
 * sections — ACCOUNTMANAGERS and TALENT MANAGERS — never mixed into one
 * flat list. Team Zwolle totals use the UNIQUE placement set: a placement
 * linked to 1 AM + 2 TMs still counts once, never three times.
 */
export function FridayReviewView({ placements, profiles, teamMembers, placementReviews, talentManagerLinks, talentManagerReviews, onOpenPlacement }: FridayReviewViewProps) {
  const [filter, setFilter] = useState<PlacementFilter>('all-opportunities');
  const [selectedAmEmail, setSelectedAmEmail] = useState<string | null>(null);
  const [selectedTmEmail, setSelectedTmEmail] = useState<string | null>(null);

  const amSummaries = buildAccountManagerSummaries(placements, profiles, teamMembers, placementReviews);
  const tmSummaries = buildTalentManagerSummaries(placements, talentManagerLinks, profiles, talentManagerReviews);
  const crossIntelligence = buildCrossIntelligence(placements, talentManagerLinks, profiles);
  // Team Zwolle's totals come from the unique placement set itself — never
  // from summing per-person counts, which would double-count a
  // multi-TM placement.
  const totals = countOpportunities(placements);
  const amCompletion = teamCompletion(amSummaries);
  const tmCompletion = talentManagerTeamCompletion(tmSummaries);

  const selectedAmIndex = selectedAmEmail ? amSummaries.findIndex((s) => s.emailNormalized === selectedAmEmail) : -1;
  const selectedAmSummary = selectedAmIndex >= 0 ? amSummaries[selectedAmIndex] : null;

  const selectedTmIndex = selectedTmEmail ? tmSummaries.findIndex((s) => s.emailNormalized === selectedTmEmail) : -1;
  const selectedTmSummary = selectedTmIndex >= 0 ? tmSummaries[selectedTmIndex] : null;

  function goToAmOffset(offset: number) {
    if (selectedAmIndex < 0 || amSummaries.length === 0) return;
    const nextIndex = (selectedAmIndex + offset + amSummaries.length) % amSummaries.length;
    setSelectedAmEmail(amSummaries[nextIndex].emailNormalized);
  }

  function goToTmOffset(offset: number) {
    if (selectedTmIndex < 0 || tmSummaries.length === 0) return;
    const nextIndex = (selectedTmIndex + offset + tmSummaries.length) % tmSummaries.length;
    setSelectedTmEmail(tmSummaries[nextIndex].emailNormalized);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="label-classified text-gold/70">Team Zwolle</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TotalTile label="Plaatsingen" value={totals.total} />
          <TotalTile label="Verlengkansen" value={totals.verleng} tone="text-gold" />
          <TotalTile label="Timingkansen" value={totals.timing} tone="text-status-go" />
          <TotalTile label="Double Opportunities" value={totals.double} tone="text-red-400" />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="border border-white/10 bg-mission-raised px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink">
            AM CHECK: {amCompletion.verifiedCount} / {amCompletion.totalCount} ACCOUNTMANAGERS GECONTROLEERD
          </div>
          <div className="border border-white/10 bg-mission-raised px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink">
            TM CHECK: {tmCompletion.verifiedCount} / {tmCompletion.totalCount} TALENT MANAGERS GECONTROLEERD
          </div>
        </div>
      </div>

      <PlacementFilterBar value={filter} onChange={setFilter} />

      <section className="flex flex-col gap-3">
        <p className="label-classified text-gold/70">Accountmanagers</p>
        {amSummaries.length === 0 ? (
          <p className="border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ink-muted">Nog geen plaatsingen geïmporteerd.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {amSummaries.map((summary) => (
              <AccountManagerSummaryCard key={summary.emailNormalized} summary={summary} onClick={() => setSelectedAmEmail(summary.emailNormalized)} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <p className="label-classified text-gold/70">Talent Managers</p>
        {tmSummaries.length === 0 ? (
          <p className="border border-dashed border-white/15 px-4 py-8 text-center text-sm text-ink-muted">Nog geen talent managers gekoppeld.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tmSummaries.map((summary) => (
              <TalentManagerSummaryCard key={summary.emailNormalized} summary={summary} onClick={() => setSelectedTmEmail(summary.emailNormalized)} />
            ))}
          </div>
        )}
      </section>

      {crossIntelligence.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="label-classified text-gold/70">Cross Intelligence</p>
          <div className="flex flex-col gap-1.5">
            {crossIntelligence.map((entry) => (
              <button
                key={`${entry.accountManagerEmail}::${entry.talentManagerEmail}`}
                type="button"
                onClick={() => setSelectedTmEmail(entry.talentManagerEmail)}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border border-white/10 bg-mission-raised px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.06em] transition-colors duration-150 hover:border-gold/40"
              >
                <span className="text-ink">
                  {entry.accountManagerDisplayName} × {entry.talentManagerDisplayName}
                </span>
                <span className="text-ink-muted">
                  {entry.placements.length} gezamenlijke plaatsing{entry.placements.length === 1 ? '' : 'en'} · {entry.counts.verleng + entry.counts.timing} kansen
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedAmSummary && (
        <AccountManagerDrawer
          summary={selectedAmSummary}
          initialFilter={filter}
          onClose={() => setSelectedAmEmail(null)}
          onOpenPlacement={onOpenPlacement}
          onNext={amSummaries.length > 1 ? () => goToAmOffset(1) : undefined}
          onPrevious={amSummaries.length > 1 ? () => goToAmOffset(-1) : undefined}
        />
      )}

      {selectedTmSummary && (
        <TalentManagerDrawer
          summary={selectedTmSummary}
          initialFilter={filter}
          onClose={() => setSelectedTmEmail(null)}
          onOpenPlacement={onOpenPlacement}
          onNext={tmSummaries.length > 1 ? () => goToTmOffset(1) : undefined}
          onPrevious={tmSummaries.length > 1 ? () => goToTmOffset(-1) : undefined}
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
