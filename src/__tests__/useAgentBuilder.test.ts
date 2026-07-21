import { describe, it, expect, beforeEach, vi, test } from 'vitest';

const { create, update, list, get, remove } = vi.hoisted(() => ({
  create: vi.fn(async (p: any) => ({ ...p, id: 'agent-1', createdAt: Date.now() })),
  update: vi.fn(async (id: string, p: any) => ({ ...p, id })),
  list: vi.fn(async () => []),
  get: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../application/agent/agentClient', () => ({
  agentClient: { create, update, list, get, remove },
}));

import { useAgentBuilder } from '../application/agent/useAgentBuilder';

describe('useAgentBuilder (portal agent builder state)', () => {
  beforeEach(() => {
    useAgentBuilder.getState().reset();
    localStorage.clear();
    create.mockClear();
    update.mockClear();
  });

  it('reset clears the spec and savedId', () => {
    const s = useAgentBuilder.getState();
    s.setName('Foo');
    s.reset();
    const a = useAgentBuilder.getState();
    expect(a.spec.name).toBe('');
    expect(a.savedId).toBeNull();
  });

  it('save() with no savedId creates the agent via agentClient.create', async () => {
    const s = useAgentBuilder.getState();
    s.setName('MyAgent');
    await s.save();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].name).toBe('MyAgent');
    expect(useAgentBuilder.getState().savedId).toBe('agent-1');
  });

  it('setStateMachine updates spec.stateMachine (Add state/transition path)', () => {
    const s = useAgentBuilder.getState();
    const sm = { initial: 's1', states: [{ id: 's1', label: 'S1', type: 'normal' }], transitions: [] };
    s.setStateMachine(sm);
    expect(useAgentBuilder.getState().spec.stateMachine).toEqual(sm);
  });

  // ACCEPTANCE GAP (DV-01): a freshly opened "new Agent" page must start EMPTY.
  // AgentBuilderPage resumes the last agent from localStorage on mount, so the
  // "New Agent" button shows existing info. Covered end-to-end by
  // e2e/portal.spec.ts; tracked here.
  test.todo('new Agent page starts empty (does not resume last agent from localStorage)');
});
