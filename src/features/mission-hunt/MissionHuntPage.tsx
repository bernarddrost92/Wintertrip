import { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { SetupRequiredNotice } from './SetupRequiredNotice';
import { MissionHuntAuthProvider } from './MissionHuntAuthProvider';
import { useMissionHuntAuth } from './missionHuntAuthContext';
import { AuthGate } from './AuthGate';
import { GoldButton } from '../../components/GoldButton';
import { useMissionHuntData } from './useMissionHuntData';
import { MyPlacementsView } from './MyPlacementsView';
import { FridayReviewView } from './FridayReviewView';
import { TeamImportPanel } from './TeamImportPanel';
import { PlacementDetailDrawer } from './PlacementDetailDrawer';
import { canEditPlacement, isOwnPlacement } from '../../services/missionHuntPermissions';
import type { TeamImportPreview } from '../../services/missionHuntImportPreview';
import type { MissionHuntProfile } from '../../types/missionHunt';

type Tab = 'my-placements' | 'team-import' | 'friday-review';

export function MissionHuntPage() {
  if (!isSupabaseConfigured()) return <SetupRequiredNotice />;

  return (
    <MissionHuntAuthProvider>
      <MissionHuntShell />
    </MissionHuntAuthProvider>
  );
}

function MissionHuntShell() {
  const { status, profile, errorMessage, signOut, retry } = useMissionHuntAuth();

  if (status === 'loading') {
    return (
      <div className="px-4 py-20 text-center">
        <p className="label-classified text-gold/70">Mission Hunt</p>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Authenticating agent…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <p className="label-classified text-gold/70">Mission Hunt</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-wide text-ink">System Error</h1>
        <p className="mt-4 text-sm text-ink-muted">{errorMessage ?? 'Mission intelligence kon niet worden geladen.'}</p>
        <GoldButton type="button" onClick={retry} className="mt-8">
          Retry
        </GoldButton>
      </div>
    );
  }

  if (status !== 'signed_in' || !profile) {
    return <AuthGate />;
  }

  return <MissionHuntDashboard profile={profile} onSignOut={signOut} />;
}

function MissionHuntDashboard({ profile, onSignOut }: { profile: MissionHuntProfile; onSignOut: () => void }) {
  const data = useMissionHuntData(profile);
  const isAdmin = profile.role === 'admin';
  const [tab, setTab] = useState<Tab>('my-placements');
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

  const myPlacements = data.placements.filter((p) => isOwnPlacement(p, profile.userId, profile.emailNormalized));
  const myReview = data.placementReviews.find((r) => r.userId === profile.userId) ?? null;

  const selectedPlacement = selectedPlacementId ? data.placements.find((p) => p.id === selectedPlacementId) ?? null : null;
  const selectedEditable = selectedPlacement ? canEditPlacement(selectedPlacement, profile.userId, profile.emailNormalized, profile.role) : false;

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
        <button type="button" onClick={onSignOut} className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted underline hover:text-gold">
          Uitloggen ({profile.displayName})
        </button>
      </div>

      {/* Admin gets tabs (My Placements / Team Placement Import / Friday
          Review); a normal member never sees a tab bar at all — they land
          directly on My Placements and stay there. */}
      {isAdmin && (
        <div className="mt-6 flex gap-1 border-b border-white/10">
          <TabButton label="My Placements" active={tab === 'my-placements'} onClick={() => setTab('my-placements')} />
          <TabButton label="Team Placement Import" active={tab === 'team-import'} onClick={() => setTab('team-import')} />
          <TabButton label="Friday Review" active={tab === 'friday-review'} onClick={() => setTab('friday-review')} />
        </div>
      )}

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
          {(!isAdmin || tab === 'my-placements') && (
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
            />
          )}
          {isAdmin && tab === 'team-import' && (
            <TeamImportPanel
              existingPlacements={data.placements.map((p) => ({ id: p.id, fingerprint: p.fingerprint, ownerDisplayName: p.ownerDisplayName, hoursPerWeek: p.hoursPerWeek, monthlyDb: p.monthlyDb }))}
              onImport={handleImport}
            />
          )}
          {isAdmin && tab === 'friday-review' && (
            <FridayReviewView
              placements={data.placements}
              profiles={data.profiles}
              teamMembers={data.teamMembers}
              placementReviews={data.placementReviews}
              onOpenPlacement={setSelectedPlacementId}
            />
          )}
        </div>
      )}

      {selectedPlacement && (
        <PlacementDetailDrawer
          placement={selectedPlacement}
          editable={selectedEditable}
          canReassign={isAdmin}
          onClose={() => setSelectedPlacementId(null)}
          onUpdateField={(field, value) => data.updatePlacementField(selectedPlacement.id, field, value)}
          onReassign={(ownerEmail, ownerDisplayName) => data.reassignPlacement(selectedPlacement.id, ownerEmail, ownerDisplayName)}
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
