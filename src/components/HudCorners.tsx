/** Four viewfinder-style corner brackets — marks a panel as the console's focal target. */
export function HudCorners() {
  return (
    <>
      <span className="hud-corner left-0 top-0 border-l-2 border-t-2" aria-hidden />
      <span className="hud-corner right-0 top-0 border-r-2 border-t-2" aria-hidden />
      <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2" aria-hidden />
      <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2" aria-hidden />
    </>
  );
}
