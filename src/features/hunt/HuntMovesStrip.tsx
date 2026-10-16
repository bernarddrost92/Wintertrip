const MOVES = [
  ['01', 'Verlengen'],
  ['02', 'PO → contract'],
  ['03', 'Nieuwe contractant'],
  ['04', 'Uren ophogen'],
] as const;

/** The four Net FTE moves as one tactical strip — never four big cards. */
export function HuntMovesStrip() {
  return (
    <section className="hunt3-moves" aria-label="Vier routes naar Net FTE">
      {MOVES.map(([code, label]) => (
        <div key={code} className="hunt3-move">
          <span>{code}</span>
          <strong>{label}</strong>
        </div>
      ))}
    </section>
  );
}
