import React from 'react';
import { Spin } from 'antd';
import { UsageView } from '../components/UsageView';
import { useUsage } from '../application/usage/useUsage';

export function UsagePage() {
  const { metrics, loading } = useUsage();
  if (loading && !metrics) return <Spin />;
  if (!metrics) return <div>No usage data.</div>;
  return <UsageView metrics={metrics} />;
}
