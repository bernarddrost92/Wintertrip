import { Component, type ReactNode } from 'react';
import { GoldButton } from '../../components/GoldButton';

interface MissionHuntErrorBoundaryProps {
  children: ReactNode;
  onBackHome: () => void;
  /** Must perform a real navigation (not just React state) — see App.tsx's
   * handleMissionHuntRetry for why an in-place retry doesn't reliably work. */
  onRetry: () => void;
}

interface MissionHuntErrorBoundaryState {
  hasError: boolean;
}

/**
 * Root cause this exists to fix: a failed dynamic import() (the
 * React.lazy-loaded Mission Hunt chunk 404ing — e.g. a stale cached
 * index.html pointing at an asset hash a redeploy removed, or any transient
 * network failure fetching that one chunk) is NOT caught by Suspense —
 * Suspense only handles the pending state. A rejected lazy import, like any
 * other uncaught render/effect error, propagates with no boundary to catch
 * it and React unmounts the ENTIRE app, leaving a blank #root — a literal
 * black screen, confirmed by direct reproduction. This class component is
 * the only way to catch that (error boundaries must be class components;
 * there is no hook equivalent), and it protects only the Mission Hunt
 * subtree — every other feature keeps working even if this trips.
 */
export class MissionHuntErrorBoundary extends Component<MissionHuntErrorBoundaryProps, MissionHuntErrorBoundaryState> {
  state: MissionHuntErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MissionHuntErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Console only — never surface the raw error, a stack trace, or any
    // request/response detail (which could carry project/client data) to
    // the user-facing UI.
    console.error('Mission Hunt failed to load:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
          <p className="label-classified text-gold/70">Mission Hunt</p>
          <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-wide text-ink">System Error</h1>
          <p className="mt-4 text-sm text-ink-muted">Mission intelligence kon niet worden geladen.</p>
          <div className="mt-8 flex gap-3">
            <GoldButton type="button" onClick={this.props.onRetry}>
              Retry
            </GoldButton>
            <GoldButton type="button" variant="subtle" onClick={this.props.onBackHome}>
              Back to Home
            </GoldButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
