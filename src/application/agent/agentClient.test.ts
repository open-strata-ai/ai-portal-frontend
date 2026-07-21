import { describe, it, expect, beforeEach, vi } from 'vitest';
import { agentClient } from './agentClient';

function mockFetch(body: unknown, status = 200) {
  (global as any).fetch = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }));
}

describe('agentClient', () => {
  beforeEach(() => {
    (global as any).fetch = undefined as any;
  });

  it('list() GETs /v1/agents and returns the agents array', async () => {
    mockFetch({ agents: [{ id: 'a1', name: 'X', createdAt: 1 }] });
    const agents = await agentClient.list();
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe('a1');
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url.endsWith('/v1/agents')).toBe(true);
    expect(init.method).toBe('GET');
  });

  it('create() POSTs the payload and returns the saved spec', async () => {
    mockFetch({ id: 'new1', name: 'My', createdAt: 2, status: 'draft' }, 201);
    const spec = await agentClient.create({ name: 'My' });
    expect(spec.id).toBe('new1');
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url.endsWith('/v1/agents')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ name: 'My' });
  });

  it('update() PATCHes /v1/agents/:id', async () => {
    mockFetch({ id: 'a1', name: 'Renamed', createdAt: 1 });
    await agentClient.update('a1', { name: 'Renamed' });
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url.endsWith('/v1/agents/a1')).toBe(true);
    expect(init.method).toBe('PATCH');
  });

  it('remove() DELETEs /v1/agents/:id', async () => {
    mockFetch({}, 204);
    await agentClient.remove('a1');
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url.endsWith('/v1/agents/a1')).toBe(true);
    expect(init.method).toBe('DELETE');
  });
});
