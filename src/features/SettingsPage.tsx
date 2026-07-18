import React, { useState } from 'react';
import { Button, Card, Input, Space, Switch } from 'antd';
import { OsProvider, type OpenStrataToken } from '@openstrata/ai-ui-kit';

export function SettingsPage() {
  const [dark, setDark] = useState(false);
  const [color, setColor] = useState('#2f6bff');
  const theme: Partial<OpenStrataToken> = { dark, colorPrimary: color };

  return (
    <Card title="Theme & brand (single-tenant: local default theme)">
      <Space direction="vertical">
        <Space>
          <span>Dark mode</span>
          <Switch checked={dark} onChange={setDark} />
        </Space>
        <Space>
          <span>Primary color</span>
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: 60 }}
          />
        </Space>
        <OsProvider theme={theme}>
          <Button type="primary">Preview primary button</Button>
        </OsProvider>
      </Space>
    </Card>
  );
}
