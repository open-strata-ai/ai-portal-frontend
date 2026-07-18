import { useCallback, useEffect, useState } from 'react';
import type { UsageMetrics } from '../../domain/types';
import { apiClient } from '../../infrastructure/apiClient';

// When ai-billing-service is absent (multi-tenant-only, ADR-0003) the /usage
// view degrades gracefully to a static fallback estimate.
const FALLBACK: UsageMetrics = {
  tokenBudget: 1_000_000,
  tokenUsed: 0,
  qpsQuota: 50,
  qpsCurrent: 0,
  vectorQuota: 100_000,
  vectorUsed: 0,
  costBudget: 100,
  costActual: 0,
  source: 'fallback',
};

export function useUsage() {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<UsageMetrics>('/usage');
      setMetrics({ ...data, source: 'billing' });
    } catch {
      setMetrics(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { metrics, loading, refresh };
}
