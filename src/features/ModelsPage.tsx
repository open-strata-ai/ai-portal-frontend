import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Tag, Spin } from 'antd';
import type { ModelInfo } from '../application/model/modelClient';
import { modelClient } from '../application/model/modelClient';

/** Models catalog (DESIGN §3.4). Fetched live from the gateway /v1/models
 *  endpoint — no hardcoded mock list. */
export function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    modelClient
      .list()
      .then((m) => !cancelled && setModels(m))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div style={{ color: '#c00' }}>Failed to load models: {error}</div>;
  if (!models) return <Spin />;

  return (
    <Row gutter={16}>
      {models.map((m) => (
        <Col span={8} key={m.id}>
          <Card title={m.name}>
            <p>ID: {m.id}</p>
            <p>Provider: {m.provider}</p>
            <p>
              Health: <Tag color={m.health === 'healthy' || m.health === 'up' ? 'green' : 'red'}>{m.health}</Tag>
            </p>
            <p>Whitelisted: {m.source === 'self-hosted' ? 'yes' : 'no'}</p>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
