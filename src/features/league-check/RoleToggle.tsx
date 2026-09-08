import type { AgentRole } from '../missionFlow/missionFlowContext';

const ROLE_OPTIONS: AgentRole[] = ['AM', 'TM'];

interface RoleToggleProps {
  value: AgentRole;
  onChange: (role: AgentRole) => void;
}

/** Two compact buttons, not a dropdown — the Agent's role is picked in one tap. */
export function RoleToggle({ value, onChange }: RoleToggleProps) {
  return (
    <div role="radiogroup" aria-label="Role" className="grid grid-cols-2 border border-gold/20 bg-mission-panel">
      {ROLE_OPTIONS.map((role, i) => {
        const selected = value === role;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(role)}
            className={`py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-150 ${
              i > 0 ? 'border-l border-gold/15' : ''
            } ${selected ? 'bg-gold text-mission-void' : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink'}`}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
}
