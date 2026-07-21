import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { DataTable, type DataTableColumn } from '@openstrata/ai-ui-kit';
import type { AgentSpec } from '../domain/types';
import { agentClient } from '../application/agent/agentClient';
import { useAgentBuilder } from '../application/agent/useAgentBuilder';

/** Agent registry (EU-05). Fetched live from the gateway /v1/agents
 *  endpoint — combines the user's persisted specs with the published catalog. */
export function AgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentSpec[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // RC-4: starting a brand-new agent must clear any previously-edited spec
  // (the builder persists the last agent id in localStorage). Reset the store
  // up front so the "New Agent" page opens blank, never pre-filled.
  const onNewAgent = () => {
    useAgentBuilder.getState().reset();
    navigate('/agents/new');
  };

  useEffect(() => {
    let cancelled = false;
    agentClient
      .list()
      .then((a) => !cancelled && setAgents(a))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div style={{ color: '#c00' }}>Failed to load agents: {error}</div>;
  if (!agents) return <Spin />;

  const columns: DataTableColumn<AgentSpec>[] = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'id', title: 'ID' },
    {
      key: 'status',
      title: 'Status',
      render: (value: unknown) => String(value ?? 'published'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={onNewAgent}>
          New Agent
        </Button>
      </div>
      <DataTable
        data={agents}
        columns={columns}
        rowKey="id"
        onRowClick={(row) => navigate(`/agents/new?id=${encodeURIComponent((row as AgentSpec).id)}`)}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
