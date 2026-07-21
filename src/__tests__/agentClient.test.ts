import { describe, it, expect, vi, beforeEach } from 'vitest';

const { get, post, request } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  request: vi.fn(),
}));
vi.mock('../infrastructure/apiClient', () => ({ apiClient: { get, post, request } }));

import { agentClient } from '../application/agent/agentClient';

describe('agentClient (locks gateway endpoint contract)', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    request.mockReset();
  });

  it('list() GETs /v1/agents and unwraps .agents', async () => {
    get.mockResolvedValue({ agents: [{ id: 'a', name: 'A' }] });
    const r = await agentClient.list();
    expect(get).toHaveBeenCalledWith('/v1/agents');
    expect(r).toEqual([{ id: 'a', name: 'A' }]);
  });

  it('create() POSTs to /v1/agents', async () => {
    post.mockResolvedValue({ id: 'a', name: 'A' });
    const r = await agentClient.create({ name: 'A' });
    expect(post).toHaveBeenCalledWith('/v1/agents', { name: 'A' });
    expect(r).toEqual({ id: 'a', name: 'A' });
  });

  it('update() PATCHes /v1/agents/{id}', async () => {
    request.mockResolvedValue({ id: 'a', name: 'B' });
    await agentClient.update('a', { name: 'B' });
    const [url, init] = request.mock.calls[0];
    expect(url).toBe('/v1/agents/a');
    expect(init.method).toBe('PATCH');
  });
});
