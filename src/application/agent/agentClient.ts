import { apiClient } from '../../infrastructure/apiClient';
import type { AgentSpec } from '../../domain/types';

/** Payload for creating a user-authored agent (POST /v1/agents). */
export interface CreateAgentPayload {
  name: string;
  description?: string;
  modelBinding?: { model: string; provider: string };
  stateMachine?: AgentSpec['stateMachine'];
  guardrails?: AgentSpec['guardrails'];
}

/**
 * Agent authoring client (EU-05). Talks to the gateway's real AgentRepository
 * — created agents are persisted server-side and survive a page refresh.
 */
export const agentClient = {
  list(): Promise<AgentSpec[]> {
    return apiClient.get<{ agents: AgentSpec[] }>('/v1/agents').then((r) => r.agents);
  },
  get(id: string): Promise<AgentSpec> {
    return apiClient.get<AgentSpec>(`/v1/agents/${encodeURIComponent(id)}`);
  },
  create(payload: CreateAgentPayload): Promise<AgentSpec> {
    return apiClient.post<AgentSpec>('/v1/agents', payload);
  },
  update(
    id: string,
    payload: Partial<CreateAgentPayload> & { status?: string },
  ): Promise<AgentSpec> {
    return apiClient.request<AgentSpec>(`/v1/agents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  remove(id: string): Promise<void> {
    return apiClient.request<void>(`/v1/agents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
