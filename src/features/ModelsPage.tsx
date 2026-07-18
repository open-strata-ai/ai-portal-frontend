import React from 'react';
import { Card, Col, Row, Tag } from 'antd';
import type { ModelCard } from '../domain/types';

const MOCK_MODELS: ModelCard[] = [
  { id: 'qwen', name: 'Qwen', provider: 'alibaba', capabilities: ['chat', 'tool'], health: 'up', whitelisted: true },
  { id: 'gpt', name: 'GPT', provider: 'openai', capabilities: ['chat'], health: 'up', whitelisted: false },
];

export function ModelsPage() {
  return (
    <Row gutter={16}>
      {MOCK_MODELS.map((m) => (
        <Col span={8} key={m.id}>
          <Card title={m.name}>
            <p>Provider: {m.provider}</p>
            <p>
              Health: <Tag color={m.health === 'up' ? 'green' : 'red'}>{m.health}</Tag>
            </p>
            <p>Whitelisted: {m.whitelisted ? 'yes' : 'no'}</p>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
