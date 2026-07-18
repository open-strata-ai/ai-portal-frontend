import React from 'react';
import { Button, Card, Input, Space } from 'antd';
import { AgentBuilder } from '../components/AgentBuilder';
import { useAgentBuilder } from '../application/agent/useAgentBuilder';
import type { StateMachine } from '../domain/types';

const EMPTY: StateMachine = { initial: '', states: [], transitions: [] };

export function AgentBuilderPage() {
  const { spec, setName, setStateMachine } = useAgentBuilder();
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small">
        <Space>
          <Input
            placeholder="Agent name"
            value={spec.name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="primary">Save AgentSpec</Button>
        </Space>
      </Card>
      <AgentBuilder value={spec.stateMachine ?? EMPTY} onChange={setStateMachine} />
    </Space>
  );
}
