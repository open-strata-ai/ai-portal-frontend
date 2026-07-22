// Domain types for ai-portal-frontend. Pure data contracts — no HTTP/UI deps
// (dependency inversion: infrastructure implements Ports over these).

export type Role = 'platform-admin' | 'tenant-admin' | 'developer' | 'viewer';

export interface ModelBinding {
  model: string;
  provider: string;
}

export type GuardrailType = 'injection' | 'pii' | 'rate-limit' | 'custom';

export interface Guardrail {
  id: string;
  type: GuardrailType;
  description: string;
}

export type StateNodeType = 'start' | 'end' | 'normal';

export interface StateNode {
  id: string;
  label: string;
  type: StateNodeType;
}

export interface Transition {
  from: string;
  to: string;
  event: string;
}

/** Declarative, runtime-independent agent definition (DESIGN §4.3.5). */
export interface StateMachine {
  initial: string;
  states: StateNode[];
  transitions: Transition[];
}

export interface AgentSpec {
  id: string;
  name: string;
  description?: string;
  modelBinding?: ModelBinding;
  stateMachine?: StateMachine;
  guardrails?: Guardrail[];
  status?: 'draft' | 'published' | 'deprecated';
  createdAt: number;
  updatedAt?: number;
}

export interface ModelCard {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  pricePer1k?: number;
  health: 'up' | 'down' | 'degraded';
  whitelisted: boolean;
}

/** Usage dimensions echo DESIGN §7.3 (Token / QPS / Vector / Cost). */
export interface UsageMetrics {
  tokenBudget: number;
  tokenUsed: number;
  qpsQuota: number;
  qpsCurrent: number;
  vectorQuota: number;
  vectorUsed: number;
  costBudget: number;
  costActual: number;
  /** Where the figures came from (ADR-0003 fallback chain). */
  source: 'billing' | 'gateway' | 'fallback';
}
