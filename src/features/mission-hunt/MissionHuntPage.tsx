import { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { SetupRequiredNotice } from './SetupRequiredNotice';
import { useMissionHuntRoster } from './useMissionHuntRoster';
import { WhoAreYouGate } from './WhoAreYouGate';
import { getSelectedPersonId, setSelectedPersonId, clearSelectedPersonId } from './personStorage';
import { GoldButton } from '../../components/GoldButton';
import { useMissionHuntData } from './useMissionHuntData';
import { MyPlacementsView } from './MyPlacementsView';
import { MyProfessionalsView } from './MyProfessionalsView';
import { FridayReviewView } from './FridayReviewView';
import { TeamImportPanel } from './TeamImportPanel';
import { PlacementDetailDrawer } from './PlacementDetailDrawer';
import { buildTalentManagerSummaries } from '../../services/missionHuntAggregate';
import { isOwnPlacement } from '../../services/missionHuntPermissions';
import type { TeamImportPreview } from '../../services/missionHuntImportPreview';
import type { MissionHuntProfile } from '../../types/missionHunt';

type Tab = 'my-placements' | 'team-import' | 'friday-review';

/** Roles that operate on the whole team's data day-to-day and so land on
 * Friday Review by default — purely a UX choice now (see
 * missionHuntPermissions.ts), never a write restriction. */
const OPERATIONAL_ROLES: ReadonlySet<MissionHuntProfile['role']> = new Set(['admin', 'manager', 'office_manager', 'hr']);

function defaultTabFor(role: MissionHuntProfile['role']): Tab {
  return OPERATIONAL_ROLES.has(role) ? 'friday-review' : 'my-placements';
}

export function MissionHuntPage() {
  if (!isSupabaseConfigured()) return <SetupRequiredNotice />;
  return <MissionHuntShell />;
}

function MissionHuntShell() {
  const roster = useMissionHuntRoster();
  const [selectedId, setSelectedId] = useState<string | null>(() => getSelectedPersonId());

  if (roster.loading) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="label-classified text-gold/70">Mission Hunt</p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Loading team roster…</p>
      </div>
    );
  }

  if (roster.error) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <p className="label-classified text-gold/70">Mission Hunt</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-wide text-ink">System Error</h1>
        <p className="mt-4 text-sm text-ink-muted">{roster.error}</p>
        <GoldButton type="button" onClick={roster.refresh} className="mt-8">
          Retry
        </GoldButton>
      </div>
    );
  }

  const selectedProfile = selectedId ? roster.profiles.find((p) => p.id === selectedId) ?? null : null;

  if (!selectedProfile) {
    return (
      <WhoAreYouGate
        profiles={roster.profiles}
        onContinue={(id) => {
          setSelectedPersonId(id);
          setSelectedId(id);
        }}
      />
    );
  }

  return (
    <MissionHuntDashboard
      profile={selectedProfile}
      onSwitchPerson={() => {
        clearSelectedPersonId();
        setSelectedId(null);
      }}
    />
  );
}

function MissionHuntDashboard({ profile, onSwitchPerson }: { profile: MissionHuntProfile; onSwitchPerson: () => void }) {
  const data = useMissionHuntData(profile);
  const [tab, setTab] = useState<Tab>(() => defaultTabFor(profile.role));
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

  const myPlacements = data.placements.filter((p) => isOwnPlacement(p, profile.userId, profile.emailNormalized));
  const myReview = data.placementReviews.find((r) => r.userId === profile.userId) ?? null;

  const talentManagerSummaries = buildTalentManagerSummaries(data.placements, data.talentManagerLinks, data.profiles, data.talentManagerReviews);
  const myTalentManagerSummary = talentManagerSummaries.find((s) => s.emailNormalized === profile.emailNormalized) ?? null;
  const myTalentManagerReview = data.talentManagerReviews.find((r) => r.userId === profile.userId) ?? null;

  const selectedPlacement = selectedPlacementId ? data.placements.find((p) => p.id === selectedPlacementId) ?? null : null;
  const selectedTalentManagerLinks = selectedPlacement ? data.talentManagerLinks.filter((l) => l.projectId === selectedPlacement.id) : [];
  const knownTalentManagerOptions = [...new Map(data.talentManagerLinks.map((l) => [l.talentManagerEmail, { email: l.talentManagerEmail, displayName: l.talentManagerDisplayName ?? l.talentManagerEmail }])).values()];

  async function handleImport(preview: TeamImportPreview) {
    return data.importTeamPlacements(preview);
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-classified text-gold/70">007 · Project Intelligence</p>
          <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-wide text-ink sm:text-4xl">Mission Hunt</h1>
        </div>
        <div className="text-right">
          <p className="label-classified text-ink-muted">
            Current Agent · <span className="text-ink">{profile.displayName}</span>
          </p>
          <button type="button" onClick={onSwitchPerson} className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted underline hover:text-gold">
            Wissel persoon
          </button>
        </div>
      </div>

      {/* Every team member sees the full tab set now — roles only pick the
          default tab (defaultTabFor above), never which tabs exist. */}
      <div className="mt-6 flex gap-1 border-b border-white/10">
        <TabButton label="My Placements" active={tab === 'my-placements'} onClick={() => setTab('my-placements')} />
        <TabButton label="Team Placement Import" active={tab === 'team-import'} onClick={() => setTab('team-import')} />
        <TabButton label="Friday Review" active={tab === 'friday-review'} onClick={() => setTab('friday-review')} />
      </div>

      {data.loading && <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Loading project intelligence…</p>}
      {data.error && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <p className="text-sm text-red-400">{data.error}</p>
          <GoldButton type="button" variant="subtle" onClick={data.refresh} className="!px-3 !py-1.5 !text-xs">
            Retry
          </GoldButton>
        </div>
      )}

      {!data.loading && !data.error && (
        <div className="mt-6">
          {tab === 'my-placements' && (
            <div className="flex flex-col gap-10">
              <MyPlacementsView
                displayName={profile.displayName}
                placements={myPlacements}
                isVerified={myReview !== null}
                verifiedAt={myReview?.verifiedAt ?? null}
                onAdd={async (input) => {
                  await data.addPlacement(input);
                }}
                onOpenPlacement={setSelectedPlacementId}
                onVerify={async () => {
                  await data.submitVerification(myPlacements.length);
                }}
                opportunityReviews={data.opportunityReviews}
                onReviewOpportunity={async (projectId, status, actionType, note) => {
                  await data.upsertOpportunityReview(projectId, status, actionType, note);
                }}
              />
              {/* Additive: shown only once ≥1 placement is linked to me as a
                  Talent Manager — never a new tab, so "My Placements" stays
                  exactly what it always was for an AM-only user. */}
              {myTalentManagerSummary && (
                <MyProfessionalsView
                  displayName={profile.displayName}
                  summary={myTalentManagerSummary}
                  isVerified={myTalentManagerReview !== null}
                  verifiedAt={myTalentManagerReview?.verifiedAt ?? null}
                  onOpenPlacement={setSelectedPlacementId}
                  onVerify={async () => {
                    await data.submitTalentManagerVerification(myTalentManagerSummary.counts.total);
                  }}
                />
              )}
            </div>
          )}
          {tab === 'team-import' && (
            <TeamImportPanel
              existingPlacements={data.placements.map((p) => ({
                id: p.id,
                fingerprint: p.fingerprint,
                ownerDisplayName: p.ownerDisplayName,
                hoursPerWeek: p.hoursPerWeek,
                monthlyDb: p.monthlyDb,
                talentManagerEmails: data.talentManagerLinks.filter((l) => l.projectId === p.id).map((l) => l.talentManagerEmail),
              }))}
              onImport={handleImport}
            />
          )}
          {tab === 'friday-review' && (
            <FridayReviewView
              placements={data.placements}
              profiles={data.profiles}
              teamMembers={data.teamMembers}
              placementReviews={data.placementReviews}
              talentManagerLinks={data.talentManagerLinks}
              talentManagerReviews={data.talentManagerReviews}
              onOpenPlacement={setSelectedPlacementId}
              opportunityReviews={data.opportunityReviews}
            />
          )}
        </div>
      )}

      {selectedPlacement && (
        <PlacementDetailDrawer
          placement={selectedPlacement}
          editable
          canReassign
          talentManagerLinks={selectedTalentManagerLinks}
          canManageTalentManagers
          knownTalentManagerOptions={knownTalentManagerOptions}
          onClose={() => setSelectedPlacementId(null)}
          onUpdateField={(field, value) => data.updatePlacementField(selectedPlacement.id, field, value)}
          onReassign={(ownerEmail, ownerDisplayName) => data.reassignPlacement(selectedPlacement.id, ownerEmail, ownerDisplayName)}
          onUpdateTalentManagers={(emails, displayNames) => data.setPlacementTalentManagers(selectedPlacement.id, emails, displayNames)}
          onDelete={() => {
            data.deletePlacement(selectedPlacement.id);
            setSelectedPlacementId(null);
          }}
        />
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`border-b-2 px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${
        active ? 'border-gold text-gold' : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}
