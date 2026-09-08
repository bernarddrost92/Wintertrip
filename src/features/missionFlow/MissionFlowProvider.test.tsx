import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useMissionFlow } from './missionFlowContext';
import { MissionFlowProvider } from './MissionFlowProvider';

function TestConsumer() {
  const { agent, updateAgent, resetAgent } = useMissionFlow();
  return (
    <div>
      <p>agentName: {agent.agentName || '(empty)'}</p>
      <p>agentRole: {agent.agentRole}</p>
      <p>professionalName: {agent.professionalName || '(empty)'}</p>
      <button type="button" onClick={() => updateAgent('agentName', 'Bernard')}>
        Set Agent Name
      </button>
      <button type="button" onClick={() => updateAgent('agentRole', 'TM')}>
        Set Role TM
      </button>
      <button type="button" onClick={() => updateAgent('professionalName', 'Tim Jansen')}>
        Set Professional
      </button>
      <button type="button" onClick={resetAgent}>
        New Mission
      </button>
    </div>
  );
}

describe('MissionFlowProvider — Agent identity (Agent/Role/Professional travel through the flow)', () => {
  it('starts with an empty Agent name, AM role, and empty Professional name', () => {
    render(
      <MissionFlowProvider>
        <TestConsumer />
      </MissionFlowProvider>,
    );
    expect(screen.getByText('agentName: (empty)')).toBeInTheDocument();
    expect(screen.getByText('agentRole: AM')).toBeInTheDocument();
    expect(screen.getByText('professionalName: (empty)')).toBeInTheDocument();
  });

  it('keeps the Agent name once set (the value that reaches the Mission Receipt)', async () => {
    const user = userEvent.setup();
    render(
      <MissionFlowProvider>
        <TestConsumer />
      </MissionFlowProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Set Agent Name' }));
    expect(screen.getByText('agentName: Bernard')).toBeInTheDocument();
  });

  it('switches the role to TM when selected', async () => {
    const user = userEvent.setup();
    render(
      <MissionFlowProvider>
        <TestConsumer />
      </MissionFlowProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Set Role TM' }));
    expect(screen.getByText('agentRole: TM')).toBeInTheDocument();
  });

  it('keeps the Professional name once set', async () => {
    const user = userEvent.setup();
    render(
      <MissionFlowProvider>
        <TestConsumer />
      </MissionFlowProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Set Professional' }));
    expect(screen.getByText('professionalName: Tim Jansen')).toBeInTheDocument();
  });

  it('New Mission resets the Agent name, role, and Professional name back to defaults', async () => {
    const user = userEvent.setup();
    render(
      <MissionFlowProvider>
        <TestConsumer />
      </MissionFlowProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Set Agent Name' }));
    await user.click(screen.getByRole('button', { name: 'Set Role TM' }));
    await user.click(screen.getByRole('button', { name: 'Set Professional' }));
    expect(screen.getByText('agentName: Bernard')).toBeInTheDocument();
    expect(screen.getByText('agentRole: TM')).toBeInTheDocument();
    expect(screen.getByText('professionalName: Tim Jansen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New Mission' }));

    expect(screen.getByText('agentName: (empty)')).toBeInTheDocument();
    expect(screen.getByText('agentRole: AM')).toBeInTheDocument();
    expect(screen.getByText('professionalName: (empty)')).toBeInTheDocument();
  });
});
