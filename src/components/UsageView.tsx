import React from 'react';
import { Card, Col, Progress, Row, Statistic, Tag } from 'antd';
import type { UsageMetrics } from '../domain/types';

function pct(used: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
}

/** Usage/quota dashboard (DESIGN §7.3): Token / QPS / Vector / Cost. */
export function UsageView({ metrics }: { metrics: UsageMetrics }) {
  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card>
          <Statistic title="Token used" value={metrics.tokenUsed} suffix={`/ ${metrics.tokenBudget}`} />
          <Progress percent={pct(metrics.tokenUsed, metrics.tokenBudget)} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="QPS" value={metrics.qpsCurrent} suffix={`/ ${metrics.qpsQuota}`} />
          <Progress percent={pct(metrics.qpsCurrent, metrics.qpsQuota)} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Vectors" value={metrics.vectorUsed} suffix={`/ ${metrics.vectorQuota}`} />
          <Progress percent={pct(metrics.vectorUsed, metrics.vectorQuota)} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Cost ($)" value={metrics.costActual} suffix={`/ ${metrics.costBudget}`} />
          <Progress percent={pct(metrics.costActual, metrics.costBudget)} />
        </Card>
      </Col>
      <Col span={24}>
        <Tag color={metrics.source === 'billing' ? 'green' : 'orange'}>source: {metrics.source}</Tag>
      </Col>
    </Row>
  );
}
