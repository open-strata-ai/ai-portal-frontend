import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockGet = vi.fn();
vi.mock('./agentClient', () => ({
  agentClient: {
    list: vi.fn(),
    get: (id: string) => mockGet(id),
    create: (p: any) => mockCreate(p),
    update: (id: string, p: any) => mockUpdate(id, p),
    remove: vi.fn(),
  },
}));

import { useAgentBuilder } from './useAgentBuilder';

function stubLocalStorage() {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
}

describe('useAgentBuilder', () => {
  beforeEach(() => {
    stubLocalStorage();
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockGet.mockReset();
    useAgentBuilder.getState().reset();
  });

  it('setName updates the name and marks the spec dirty', () => {
    useAgentBuilder.getState().setName('Agent1');
    expect(useAgentBuilder.getState().spec.name).toBe('Agent1');
    expect(useAgentBuilder.getState().isDirty).toBe(true);
  });

  it('save() with an empty name records an error and does not call the API', async () => {
    await useAgentBuilder.getState().save();
    expect(useAgentBuilder.getState().error).toMatch(/name/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('save() creates when there is no savedId, then patches on a subsequent save', async () => {
    mockCreate.mockResolvedValueOnce({ id: 'a1', name: 'A', createdAt: 1 });
    useAgentBuilder.getState().setName('A');
    await useAgentBuilder.getState().save();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(useAgentBuilder.getState().savedId).toBe('a1');
    expect(useAgentBuilder.getState().isDirty).toBe(false);

    mockUpdate.mockResolvedValueOnce({ id: 'a1', name: 'A2', createdAt: 1, updatedAt: 2 });
    useAgentBuilder.getState().setName('A2');
    await useAgentBuilder.getState().save();
    expect(mockUpdate).toHaveBeenCalledWith('a1', expect.objectContaining({ name: 'A2' }));
    expect(useAgentBuilder.getState().spec.name).toBe('A2');
  });

  it('load() fetches the agent and records its id as saved', async () => {
    mockGet.mockResolvedValueOnce({ id: 'a1', name: 'Loaded', createdAt: 1 });
    await useAgentBuilder.getState().load('a1');
    expect(mockGet).toHaveBeenCalledWith('a1');
    expect(useAgentBuilder.getState().spec.name).toBe('Loaded');
    expect(useAgentBuilder.getState().savedId).toBe('a1');
  });
});
