import type { ReactNode } from 'react';

interface MissionCheckBlockProps {
  label: string;
  children: ReactNode;
}

/** A "mission briefing" block — a bold gold group title over its checks,
 * so the League Check reads as three strong statements rather than one
 * long administrative list. */
export function MissionCheckBlock({ label, children }: MissionCheckBlockProps) {
  return (
    <div className="border border-gold/15 bg-mission-panel">
      <p className="border-b border-gold/15 px-4 py-2.5 font-display text-xl font-bold uppercase tracking-[0.08em] text-gold">{label}</p>
      <ul>{children}</ul>
    </div>
  );
}
