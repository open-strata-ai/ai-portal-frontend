import React from 'react';
import { useSession } from '../infrastructure/session';

/** Route guard: in local dev mode the session is always authed (ADR-0002). */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  if (!session.authed) {
    return <div style={{ padding: 24 }}>Redirecting to login…</div>;
  }
  return <>{children}</>;
}
