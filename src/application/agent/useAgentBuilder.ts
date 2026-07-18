import { create } from 'zustand';
import type { AgentSpec, Guardrail, StateMachine } from '../../domain/types';

interface AgentBuilderState {
  spec: AgentSpec;
  setName: (name: string) => void;
  setStateMachine: (sm: StateMachine) => void;
  addGuardrail: (g: Guardrail) => void;
}

export const useAgentBuilder = create<AgentBuilderState>((set) => ({
  spec: { id: 'draft', name: 'Untitled Agent', createdAt: Date.now() },
  setName: (name) => set((s) => ({ spec: { ...s.spec, name } })),
  setStateMachine: (sm) => set((s) => ({ spec: { ...s.spec, stateMachine: sm } })),
  addGuardrail: (g) =>
    set((s) => ({ spec: { ...s.spec, guardrails: [...(s.spec.guardrails ?? []), g] } })),
}));
