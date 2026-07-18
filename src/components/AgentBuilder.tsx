import React, { useState } from 'react';
import { Button, Card, Input, Select, Space, Tag } from 'antd';
import { MermaidRenderer } from '@openstrata/ai-ui-kit';
import type { StateMachine, Transition } from '../domain/types';

/** Serialize the state machine to a Mermaid stateDiagram (ADR-0001). */
function toMermaid(sm: StateMachine): string {
  const lines = ['stateDiagram-v2'];
  if (sm.transitions.length === 0) {
    sm.states.forEach((s) => lines.push(`  [*] --> ${s.id}`));
  } else {
    sm.transitions.forEach((t) => lines.push(`  ${t.from} --> ${t.to} : ${t.event}`));
  }
  return lines.join('\n');
}

/** Lightweight state-machine editor for the Agent builder (ADR-0001). */
export function AgentBuilder({
  value,
  onChange,
}: {
  value: StateMachine;
  onChange: (sm: StateMachine) => void;
}) {
  const [stateName, setStateName] = useState('');
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const [event, setEvent] = useState('');

  const addState = () => {
    const label = stateName.trim();
    if (!label) return;
    const id = label.replace(/\s+/g, '_');
    const isFirst = value.states.length === 0;
    onChange({
      ...value,
      initial: isFirst ? id : value.initial,
      states: [...value.states, { id, label, type: isFirst ? 'start' : 'normal' }],
    });
    setStateName('');
  };

  const addTransition = () => {
    if (!from || !to || !event.trim()) return;
    const t: Transition = { from, to, event: event.trim() };
    onChange({ ...value, transitions: [...value.transitions, t] });
    setEvent('');
  };

  const stateOptions = value.states.map((s) => ({ value: s.id, label: s.label }));

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title="States">
        <Space>
          <Input placeholder="State name" value={stateName} onChange={(e) => setStateName(e.target.value)} />
          <Button type="primary" onClick={addState}>
            Add state
          </Button>
        </Space>
        <div style={{ marginTop: 8 }}>
          {value.states.map((s) => (
            <Tag key={s.id}>{s.label}</Tag>
          ))}
        </div>
      </Card>
      <Card size="small" title="Transitions">
        <Space>
          <Select placeholder="From" style={{ width: 140 }} value={from} onChange={setFrom} options={stateOptions} />
          <Select placeholder="To" style={{ width: 140 }} value={to} onChange={setTo} options={stateOptions} />
          <Input placeholder="Event" value={event} onChange={(e) => setEvent(e.target.value)} />
          <Button onClick={addTransition}>Add transition</Button>
        </Space>
      </Card>
      <Card size="small" title="State machine (ADR-0001)">
        <MermaidRenderer code={toMermaid(value)} />
      </Card>
    </Space>
  );
}
