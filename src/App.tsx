import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { TenantSwitcher } from '@openstrata/ai-ui-kit';
import { useSession } from './infrastructure/session';
import { OverviewPage } from './features/OverviewPage';
import { AgentsPage } from './features/AgentsPage';
import { AgentBuilderPage } from './features/AgentBuilderPage';
import { ChatPage } from './features/ChatPage';
import { ModelsPage } from './features/ModelsPage';
import { UsagePage } from './features/UsagePage';
import { SettingsPage } from './features/SettingsPage';
import { NotFound } from './features/NotFound';
import { AuthGuard } from './auth/AuthGuard';

const { Header, Sider, Content } = Layout;

const MENU = [
  { key: '/', label: 'Overview' },
  { key: '/agents', label: 'Agents' },
  { key: '/agents/new', label: 'Agent Builder' },
  { key: '/chat', label: 'Chat' },
  { key: '/models', label: 'Models' },
  { key: '/usage', label: 'Usage' },
  { key: '/settings', label: 'Settings' },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSession();
  const [tenant, setTenant] = useState(session.tenant.id);

  const selected = MENU.some((m) => m.key === location.pathname) ? location.pathname : '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200}>
        <div style={{ padding: 16, fontWeight: 600 }}>OpenStrata</div>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          items={MENU}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <span>{session.tenant.name} Portal</span>
          {session.user.roles.includes('platform-admin') && (
            <TenantSwitcher
              tenants={[{ id: 'local', name: 'Local Tenant' }]}
              value={tenant}
              onChange={setTenant}
            />
          )}
        </Header>
        <Content style={{ padding: 24 }}>
          <AuthGuard>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/new" element={<AgentBuilderPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/usage" element={<UsagePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthGuard>
        </Content>
      </Layout>
    </Layout>
  );
}
