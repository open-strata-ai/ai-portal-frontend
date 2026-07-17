# ai-portal-frontend · 规格事实源（SPECS）

> **auto-generated from `design/DESIGN.md`** — concrete specifications for route table, build pipeline, and API contracts. These are the single source of truth for implementation.

---

## §2 · Route Table Specification

### 2.1 Route Definitions

```typescript
// routes.tsx — typed route config
export const ROUTES = {
  dashboard:       { path: '/',               roles: ['*'],            tenantBound: true },
  agentList:       { path: '/agents',         roles: ['developer','tenant-admin'], tenantBound: true },
  agentNew:        { path: '/agents/new',     roles: ['developer','tenant-admin'], tenantBound: true },
  agentEdit:       { path: '/agents/:id/edit',roles: ['developer','tenant-admin'], tenantBound: true },
  agentDetail:     { path: '/agents/:id',     roles: ['developer','tenant-admin','viewer'], tenantBound: true },
  chat:            { path: '/chat',           roles: ['*'],            tenantBound: true },
  knowledge:       { path: '/knowledge',      roles: ['developer','tenant-admin'], tenantBound: true },
  tools:           { path: '/tools',          roles: ['developer','tenant-admin'], tenantBound: true },
  models:          { path: '/models',         roles: ['*'],            tenantBound: true },
  modelKeys:       { path: '/models/keys',    roles: ['tenant-admin'], tenantBound: true },
  usage:           { path: '/usage',          roles: ['*'],            tenantBound: true },
  settings:        { path: '/settings',       roles: ['tenant-admin'], tenantBound: true },
} as const;
```

### 2.2 Route Properties

| Route | Lazy Component | Params | Guard: Roles | Guard: TenantBound | Data (on mount) |
|-------|---------------|--------|-------------|-------------------|------------------|
| `/` | `DashboardPage` | — | all authenticated | yes | `GET /dashboard` (aggregated stats) |
| `/agents` | `AgentListPage` | — | developer, tenant-admin | yes | `GET /agents?tenant_id=<id>` |
| `/agents/new` | `AgentBuilderPage` | — | developer, tenant-admin | yes | template list + model catalog |
| `/agents/:id/edit` | `AgentBuilderPage` | `id: UUID` | developer, tenant-admin | yes | `GET /agents/:id` (populate builder) |
| `/agents/:id` | `AgentDetailPage` | `id: UUID` | all auth | yes | `GET /agents/:id` + chat session init |
| `/chat` | `ChatPage` | — | all auth | yes | model list for selector |
| `/knowledge` | `KnowledgePage` | — | developer, tenant-admin | yes | `GET /knowledge?tenant_id=<id>` |
| `/tools` | `ToolListPage` | — | developer, tenant-admin | yes | `GET /tools?tenant_id=<id>` |
| `/models` | `ModelCatalogPage` | — | all auth | yes | `GET /models?tenant_id=<id>` |
| `/models/keys` | `ModelKeysPage` | — | tenant-admin | yes | `GET /models/keys?tenant_id=<id>` |
| `/usage` | `UsagePage` | — | all auth | yes | `GET /usage?tenant_id=<id>` (aggregated) |
| `/settings` | `SettingsPage` | — | tenant-admin | yes | `GET /tenant/:id/settings` |

### 2.3 Route Template (for new features)

```typescript
// To add a new route:
// 1. Add to ROUTES constant above
// 2. Create React.lazy(() => import('./features/<name>/<Name>Page'))
// 3. Add to <Routes> with <Suspense fallback={<PageSkeleton />}>
// 4. Add guard via <AuthGuard route={ROUTES.<name>}>
// 5. Add menu entry in nav derivation (visible if manifest permits)
```

---

## §8 · Build & Deploy Specification

### 8.1 Vite Build Configuration

```typescript
// vite.config.ts — key overrides
export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  resolve: {
    alias: {
      '@': '/src',
      '@openstrata/ui-kit': resolve(__dirname, '../../ai-ui-kit/src'), // dev; prod = npm
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-state': ['zustand'],
          'vendor-charts': ['recharts'],
          'vendor-mermaid': ['mermaid'],
        },
      },
    },
  },
});
```

### 8.2 CI/CD Pipeline (GitHub Actions)

```
Trigger: push to main, PR to main

Jobs:
┌─────────────────────────────────────────────────────────────┐
│ 1. lint       → eslint + prettier --check                   │
│ 2. typecheck  → tsc --noEmit                                │
│ 3. test       → vitest run --coverage                       │
│ 4. build      → vite build                                  │
│ 5. scan       → trivy image scan <image>                    │
│ 6. push       → docker push <registry>/ai-portal-frontend   │
└─────────────────────────────────────────────────────────────┘

Version: read from bom.yaml → tag as ai-portal-frontend@v<version>
```

### 8.3 Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Runtime env injection via entrypoint script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

### 8.4 Runtime Configuration

```bash
# Environment variables injected at container start (not built-in):
VITE_API_BASE=https://api.openstrata.example.com    # → nginx proxy_pass
VITE_KEYCLOAK_URL=https://auth.openstrata.example.com
VITE_KEYCLOAK_REALM=openstrata
VITE_KEYCLOAK_CLIENT_ID=ai-portal
```

### 8.5 Kubernetes Helm Values (key overrides)

```yaml
# values.yaml
replicaCount: 2
image:
  repository: registry.example.com/ai-portal-frontend
  tag: "v1.4.0"
ingress:
  enabled: true
  host: portal.openstrata.example.com
configmap:
  VITE_API_BASE: "https://api.openstrata.example.com"
  VITE_KEYCLOAK_URL: "https://auth.openstrata.example.com"
```

### 8.6 Profile Gating

| Profile | Contains This Repo? | Notes |
|---------|---------------------|-------|
| starter | yes | Core — always included |
| standard | yes | Core — always included |
| advanced | yes | Core — always included |
| full | yes | Core — always included |

> `repos.yaml` pins `ai-portal-frontend@v1.4.0`. Assembly engine pulls image by tag from the registry.

---

## §5 · API Contract Summary

### 5.1 Authentication

All requests carry two required headers:

```
Authorization: Bearer <Keycloak access_token>
X-Tenant-Id: <tenant.uuid>
```

- `access_token` from `SessionContext`, auto-refreshed on 401
- `X-Tenant-Id` from `SessionContext.tenant.id`, set once on login

### 5.2 Backend Endpoints (Consumed by Portal)

| Endpoint | Method | Request Body | Response | Used In |
|----------|--------|-------------|----------|---------|
| `/api/dashboard` | GET | — | `DashboardData` (agent count, daily calls, token, health) | `/` Dashboard |
| `/api/agents` | GET | query: `tenant_id` | `AgentSummary[]` | `/agents` list |
| `/api/agents` | POST | `AgentSpec` | `AgentSpec` (with id) | `/agents/new` |
| `/api/agents/:id` | GET | — | `AgentSpec` | `/agents/:id`, `/agents/:id/edit` |
| `/api/agents/:id` | PUT | `AgentSpec` | `AgentSpec` | `/agents/:id/edit` |
| `/api/agents/:id` | DELETE | — | `204` | `/agents` (row action) |
| `/v1/chat/completions` | POST (SSE) | `ChatRequest` | SSE stream | `/chat`, `/agents/:id` (test) |
| `/api/knowledge` | GET | query: `tenant_id` | `KnowledgeEntry[]` | `/knowledge` |
| `/api/knowledge` | POST | `FormData` (file upload) | `KnowledgeEntry` | `/knowledge` (upload) |
| `/api/knowledge/:id` | DELETE | — | `204` | `/knowledge` (row action) |
| `/api/tools` | GET | query: `tenant_id` | `ToolEntry[]` | `/tools` |
| `/api/models` | GET | query: `tenant_id` | `ModelCard[]` | `/models` |
| `/api/models/keys` | GET | query: `tenant_id` | `ModelKey[]` | `/models/keys` |
| `/api/models/keys` | POST | `{ provider, key }` | `ModelKey` | `/models/keys` |
| `/api/models/keys/:id` | DELETE | — | `204` | `/models/keys` |
| `/api/usage` | GET | query: `tenant_id, range` | `UsageData` | `/usage` |
| `/api/tenant/settings` | GET | — | `TenantSettings` | `/settings` |
| `/api/tenant/settings` | PUT | `TenantSettings` | `TenantSettings` | `/settings` |
| `/api/members` | GET | — | `Member[]` | `/settings` |
| `/api/members/invite` | POST | `{ email, role }` | `Invitation` | `/settings` |

### 5.3 Key Data Types

```typescript
// Domain types consumed by the portal
interface AgentSpec {
  id?: string;
  name: string;
  description: string;
  template_id?: string;
  model_binding: ModelBinding[];
  tool_bindings: ToolBinding[];
  memory_bindings: MemoryBinding[];
  knowledge_bindings: KnowledgeBinding[];
  guardrails: GuardrailConfig;
  state_machine: StateMachineSpec;
  status: 'draft' | 'published' | 'archived';
}

interface DashboardData {
  agent_count: number;
  daily_calls: number;
  daily_tokens: number;
  pool_health: 'healthy' | 'degraded' | 'down';
  alerts: Alert[];
}

interface UsageData {
  token: { allocated: number; used: number; unit: string };
  qps: { allocated: number; used: number };
  vectors: { allocated: number; used: number };
  models: string[];  // whitelist
  cost: { budget: number; spent: number; currency: string };
  period: { start: string; end: string };
}

// OpenAI-compatible chat request (simplified)
interface ChatRequest {
  model: string;
  messages: { role: 'user'|'assistant'|'system'; content: string }[];
  stream: true;
  temperature?: number;
  max_tokens?: number;
}
```

### 5.4 Error Response Shape

```typescript
// All backend errors conform to this shape
interface ApiErrorResponse {
  error: {
    code: string;        // e.g., 'AGENT_NAME_CONFLICT'
    message: string;     // User-safe message
    details?: Record<string, string[]>;  // Field-level for 422
    trace_id: string;    // For audit / support
  };
}
```

### 5.5 Rate Limiting Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1620000000
Retry-After: 30
```

Backend sends these on 429 responses. Frontend respects `Retry-After` for backoff scheduling.

### 5.6 Contract Evolution

- Breaking changes to API contracts trigger a MAJOR version bump in `bom.yaml`
- Portal code regenerates types from OpenAPI spec (tooling TBD per §11 open question 4)
- Current stage: types maintained manually in `domain/` — synchronization is a known risk
