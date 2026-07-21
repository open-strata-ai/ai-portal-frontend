import { apiClient } from '../../infrastructure/apiClient';

/** A model as returned by GET /v1/models (gateway catalog projection). */
export interface ModelInfo {
  id: string;
  name: string;
  capability: string;
  source: string;
  provider: string;
  health: string;
}

/** Model catalog client (DESIGN §3.4). Real, tenant-scoped list from the gateway. */
export const modelClient = {
  list(): Promise<ModelInfo[]> {
    return apiClient
      .get<{ object: string; data: ModelInfo[] }>('/v1/models')
      .then((r) => r.data ?? []);
  },
};
