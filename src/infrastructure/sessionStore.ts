// Mutable, non-React session reference read by the API client at request time.
// Avoids a circular import between the React session provider and apiClient.

export interface SessionRef {
  accessToken: string;
  tenantId: string;
}

let current: SessionRef = { accessToken: '', tenantId: 'local' };

export function setSessionRef(ref: SessionRef): void {
  current = ref;
}

export function getSessionRef(): SessionRef {
  return current;
}
