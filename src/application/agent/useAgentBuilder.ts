import { create } from 'zustand';
import type { AgentSpec, Guardrail, StateMachine } from '../../domain/types';
import { agentClient, type CreateAgentPayload } from './agentClient';

/** localStorage key holding the id of the last-saved agent (so a refresh
 *  reloads the same agent instead of starting blank). */
const LAST_AGENT_KEY = 'openstrata.agent.lastId';

function emptySpec(): AgentSpec {
  return { id: '', name: '', createdAt: Date.now() };
}

interface AgentBuilderState {
  spec: AgentSpec;
  savedId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
  setName: (name: string) => void;
  setDescription: (d: string) => void;
  setModelBinding: (m: { model: string; provider: string } | undefined) => void;
  setStateMachine: (sm: StateMachine) => void;
  addGuardrail: (g: Guardrail) => void;
  load: (id: string) => Promise<void>;
  save: () => Promise<void>;
  reset: () => void;
}

export const useAgentBuilder = create<AgentBuilderState>((set, get) => ({
  spec: emptySpec(),
  savedId: null,
  isLoading: false,
  isSaving: false,
  isDirty: false,
  error: null,

  setName: (name) => set((s) => ({ spec: { ...s.spec, name }, isDirty: true })),
  setDescription: (d) => set((s) => ({ spec: { ...s.spec, description: d }, isDirty: true })),
  setModelBinding: (m) =>
    set((s) => ({ spec: { ...s.spec, modelBinding: m }, isDirty: true })),
  setStateMachine: (sm) => set((s) => ({ spec: { ...s.spec, stateMachine: sm }, isDirty: true })),
  addGuardrail: (g) =>
    set((s) => ({
      spec: { ...s.spec, guardrails: [...(s.spec.guardrails ?? []), g] },
      isDirty: true,
    })),

  load: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const spec = await agentClient.get(id);
      localStorage.setItem(LAST_AGENT_KEY, spec.id);
      set({ spec, savedId: spec.id, isLoading: false, isDirty: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  save: async () => {
    const { spec, savedId } = get();
    if (!spec.name.trim()) {
      set({ error: 'Agent name is required.' });
      return;
    }
    const payload: CreateAgentPayload = {
      name: spec.name,
      description: spec.description,
      modelBinding: spec.modelBinding,
      stateMachine: spec.stateMachine,
      guardrails: spec.guardrails,
    };
    set({ isSaving: true, error: null });
    try {
      // Re-use the same object identity; PATCH when editing an existing spec.
      const saved =
        savedId && savedId === spec.id
          ? await agentClient.update(savedId, payload)
          : await agentClient.create(payload);
      localStorage.setItem(LAST_AGENT_KEY, saved.id);
      set({ spec: saved, savedId: saved.id, isSaving: false, isDirty: false });
    } catch (e) {
      set({ isSaving: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  reset: () => {
    localStorage.removeItem(LAST_AGENT_KEY);
    set({ spec: emptySpec(), savedId: null, isDirty: false, error: null });
  },
}));
