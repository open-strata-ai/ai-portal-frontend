import { describe, it, expect, beforeEach, vi } from 'vitest';
import { modelClient } from './modelClient';

function mockFetch(body: unknown, status = 200) {
  (global as any).fetch = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }));
}

describe('modelClient', () => {
  beforeEach(() => {
    (global as any).fetch = undefined as any;
  });

  it('list() GETs /v1/models and returns the data array', async () => {
    mockFetch({
      object: 'list',
      data: [{ id: 'cloud-qwen-max', name: 'cloud-qwen-max', capability: 'chat', source: 'third-party', provider: 'alibaba', health: 'healthy' }],
    });
    const models = await modelClient.list();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('cloud-qwen-max');
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url.endsWith('/v1/models')).toBe(true);
    expect(init.method).toBe('GET');
  });

  it('list() returns an empty array when the response has no data', async () => {
    mockFetch({ object: 'list' });
    const models = await modelClient.list();
    expect(models).toEqual([]);
  });
});
