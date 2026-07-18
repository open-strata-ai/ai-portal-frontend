import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '@openstrata/ai-ui-kit';
import type { AgentSpec } from '../domain/types';

const MOCK_AGENTS: AgentSpec[] = [
  { id: 'a1', name: 'Support Bot', createdAt: Date.now() },
  { id: 'a2', name: 'Research Helper', createdAt: Date.now() },
];

export function AgentsPage() {
  const navigate = useNavigate();
  const columns: DataTableColumn<AgentSpec>[] = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'id', title: 'ID' },
  ];
  return (
    <DataTable
      data={MOCK_AGENTS}
      columns={columns}
      rowKey="id"
      onRowClick={() => navigate('/agents/new')}
      pagination={{ pageSize: 10 }}
    />
  );
}
