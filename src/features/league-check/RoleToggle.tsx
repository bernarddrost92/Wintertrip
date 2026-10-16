import type { AgentRole } from '../missionFlow/missionFlowContext';

const ROLE_OPTIONS: AgentRole[] = ['AM', 'TM'];

interface RoleToggleProps {
  value: AgentRole;
  onChange: (role: AgentRole) => void;
}

/** Two compact buttons, not a dropdown — the Agent's role is picked in one tap. */
export function RoleToggle({ value, onChange }: RoleToggleProps) {
  return (
    <div role="radiogroup" aria-label="Rol" className="grid grid-cols-2 border border-white/10 bg-mission-panel">
      {ROLE_OPTIONS.map((role, i) => {
        const selected = value === role;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(role)}
            className={`min-h-[46px] py-2.5 text-sm font-semibold uppercase tracking-[0.08em] transition-colors duration-150 ${
              i > 0 ? 'border-l border-white/[0.07]' : ''
            } ${selected ? 'bg-gold text-mission-void' : 'text-ink-muted hover:bg-white/[0.03] hover:text-ink'}`}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
}
