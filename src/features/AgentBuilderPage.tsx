import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Input, Select, Space, Spin, Tag } from 'antd';
import { AgentBuilder } from '../components/AgentBuilder';
import { useAgentBuilder } from '../application/agent/useAgentBuilder';
import { modelClient, type ModelInfo } from '../application/model/modelClient';
import type { StateMachine } from '../domain/types';

const EMPTY: StateMachine = { initial: '', states: [], transitions: [] };

export function AgentBuilderPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const idParam = params.get('id');

  const {
    spec,
    savedId,
    isLoading,
    isSaving,
    isDirty,
    error,
    setName,
    setDescription,
    setModelBinding,
    setStateMachine,
    load,
    save,
    reset,
  } = useAgentBuilder();

  const [models, setModels] = useState<ModelInfo[]>([]);
  const didLoad = useRef(false);

  // Load on mount: explicit ?id= wins, otherwise resume the last-saved agent
  // so a page refresh keeps showing the agent the user actually built.
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    const target = idParam ?? localStorage.getItem('openstrata.agent.lastId');
    if (target) void load(target);
  }, [idParam, load]);

  useEffect(() => {
    modelClient.list().then(setModels).catch(() => setModels([]));
  }, []);

  const onModelChange = (modelId: string) => {
    const m = models.find((x) => x.id === modelId);
    setModelBinding(m ? { model: m.id, provider: m.provider } : undefined);
  };

  const onNew = () => {
    reset();
    navigate('/agents/new');
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small">
        <Space wrap>
          <Input
            placeholder="Agent name"
            value={spec.name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: 240 }}
          />
          <Input.TextArea
            placeholder="Description"
            value={spec.description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ width: 320 }}
          />
          <Select
            placeholder="Model binding"
            style={{ width: 200 }}
            value={spec.modelBinding?.model}
            onChange={onModelChange}
            options={models.map((m) => ({ value: m.id, label: m.name }))}
            allowClear
          />
          <Button type="primary" loading={isSaving} onClick={() => void save()}>
            {savedId ? 'Save AgentSpec' : 'Create AgentSpec'}
          </Button>
          <Button onClick={onNew}>New</Button>
        </Space>
        <div style={{ marginTop: 8 }}>
          {isLoading && <Spin size="small" />}
          {savedId && !isLoading && (
            <Tag color="green">Saved · {savedId}</Tag>
          )}
          {isDirty && !isSaving && <Tag color="orange">unsaved changes</Tag>}
          {error && <span style={{ color: '#c00', marginLeft: 8 }}>{error}</span>}
        </div>
      </Card>
      <AgentBuilder value={spec.stateMachine ?? EMPTY} onChange={setStateMachine} />
    </Space>
  );
}
