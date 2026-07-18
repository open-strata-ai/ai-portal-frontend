import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { useSession } from '../infrastructure/session';

export function OverviewPage() {
  const session = useSession();
  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card>
          <Statistic title="Tenant" value={session.tenant.name} />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic title="Plan" value={session.tenant.plan} />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic title="Agents" value={0} />
        </Card>
      </Col>
    </Row>
  );
}
