import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin } from 'antd';
import { useSession } from '../infrastructure/session';
import { agentClient } from '../application/agent/agentClient';

/** Tenant overview. Agent count is fetched live from the gateway so it reflects
 *  the agent the user has actually authored (not a hardcoded 0). */
export function OverviewPage() {
  const session = useSession();
  const [agentCount, setAgentCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    agentClient
      .list()
      .then((a) => !cancelled && setAgentCount(a.length))
      .catch(() => !cancelled && setAgentCount(0));
    return () => {
      cancelled = true;
    };
  }, []);

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
          {agentCount === null ? (
            <Spin />
          ) : (
            <Statistic title="Agents" value={agentCount} />
          )}
        </Card>
      </Col>
    </Row>
  );
}
