import { useEffect, useRef, useState } from 'react';
import { STATUS_ICON, STATUS_LABEL, STATUS_ORDER, statusToneClasses } from '../../services/missionHuntStatus';
import type { ProjectStatus } from '../../types/missionHunt';

interface StatusPickerProps {
  status: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  disabled?: boolean;
}

/**
 * One tap opens a compact menu, one tap on a status saves it — no separate
 * edit form just to change a status, per spec section 18. Built to be
 * thumb-fast on mobile: the trigger itself is the current status pill, the
 * menu is a short vertical stack of large tap targets right below it.
 */
export function StatusPicker({ status, onChange, disabled = false }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleSelect(next: ProjectStatus) {
    setOpen(false);
    if (next === status) return;
    onChange(next);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1200);
  }

  if (disabled) {
    return (
      <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${statusToneClasses(status)}`}>
        <span aria-hidden>{STATUS_ICON[status]}</span>
        {STATUS_LABEL[status]}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-150 ${statusToneClasses(status)} hover:brightness-110`}
      >
        <span aria-hidden>{STATUS_ICON[status]}</span>
        {STATUS_LABEL[status]}
        {justSaved && <span className="text-[9px] normal-case tracking-normal text-gold/70">✓ opgeslagen</span>}
      </button>

      {open && (
        <div role="menu" className="absolute left-0 top-full z-20 mt-1.5 flex min-w-[168px] flex-col border border-gold/30 bg-mission-panel shadow-gold-lg">
          {STATUS_ORDER.map((candidate) => (
            <button
              key={candidate}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(candidate)}
              className={`flex items-center gap-2 px-3 py-2.5 text-left font-mono text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-100 hover:bg-white/5 ${
                candidate === status ? 'text-gold' : 'text-ink'
              }`}
            >
              <span aria-hidden>{STATUS_ICON[candidate]}</span>
              {STATUS_LABEL[candidate]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
