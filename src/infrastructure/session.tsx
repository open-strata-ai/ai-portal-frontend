import React, { createContext, useContext, useEffect, useState } from 'react';
import { setSessionRef } from './sessionStore';

export interface SessionUser {
  id: string;
  name: string;
  roles: string[];
}

export interface TenantInfo {
  id: string;
  name: string;
  plan: 'trial' | 'standard' | 'enterprise';
}

export interface SessionState {
  user: SessionUser;
  tenant: TenantInfo;
  accessToken: string;
  /** Capability flags for the current tenant (DESIGN §14.5 manifest boundary). */
  manifest: Record<string, boolean>;
  authed: boolean;
}

const SessionContext = createContext<SessionState | null>(null);

/** Single-tenant dev mode (ADR-0002): mint a local session (tenant_id=local). */
function devSession(): SessionState {
  return {
    user: { id: 'local-user', name: 'Local Developer', roles: ['developer', 'tenant-admin'] },
    tenant: { id: 'local', name: 'Local Tenant', plan: 'trial' },
    accessToken: 'local-dev-token',
    manifest: { chat: true, agents: true, knowledge: true, models: true, usage: true, settings: true },
    authed: true,
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const authMode = import.meta.env.VITE_AUTH_MODE ?? 'local';
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    if (authMode === 'local') {
      const s = devSession();
      setSessionRef({ accessToken: s.accessToken, tenantId: s.tenant.id });
      setSession(s);
    } else {
      // Keycloak OIDC production path (ADR-0002) — stub: would redirect to IdP.
      // Kept as a dev session so the app remains runnable for codegen verification.
      console.warn(
        '[session] Keycloak auth mode is not implemented in this codegen deliverable; using local dev session.',
      );
      const s = devSession();
      setSessionRef({ accessToken: s.accessToken, tenantId: s.tenant.id });
      setSession(s);
    }
  }, [authMode]);

  if (!session) return null;
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession must be used within a SessionProvider');
  return s;
}
