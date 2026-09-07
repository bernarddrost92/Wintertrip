import type { ReactNode } from 'react';
import { HudCorners } from './HudCorners';

interface CommandFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * The one large "mission screen" every page's content lives inside — dark
 * glass with a gold hairline, HUD corners and an ambient bloom, floating in
 * front of the ControlRoomEnvironment rather than sitting flush against the
 * viewport like a plain page container.
 */
export function CommandFrame({ children, className = '' }: CommandFrameProps) {
  return (
    <div className={`relative mx-auto max-w-[1240px] px-3 py-8 sm:px-6 sm:py-10 lg:py-14 ${className}`}>
      <div className="command-glow" />
      <div className="command-screen">
        <HudCorners />
        <div className="command-reflection" />
        {children}
      </div>
    </div>
  );
}
