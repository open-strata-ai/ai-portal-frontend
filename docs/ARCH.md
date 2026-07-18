# ai-portal-frontend · Architecture fact source (ARCH)

> **auto-generated from `docs/DESIGN.md`** — AI coding ground truth for architecture decisions, persona mapping, route structure, and critical UX flows. Edit DESIGN.md to propagate changes.

---

## §1 · Persona & Role Matrix

The portal serves **two primary jobs**: (1) let developers build Agents; (2) let tenant members consume Agents. Four personas interact with the system, each with distinct access scopes.

| # | Persona | Role Tag | Core Motivation | Primary Routes |
|---|---------|----------|-----------------|----------------|
| P1 | **Developer** | `developer` | Assemble business ideas into runnable, debuggable, publishable Agents with minimal friction | `/agents/*`, `/models`, `/tools`, `/knowledge` |
| P2 | **Tenant Member** | `viewer` / `developer` | Use Agents out of the box — chat, search, view results — without understanding the architecture | `/chat`, `/knowledge` (browse), `/usage` (read) |
| P3 | **Tenant Admin** | `tenant-admin` | Manage own-tenant resources: quotas, members, brand, API keys within platform boundaries | `/settings`, `/usage` (manage), `/agents` (list) |
| P4 | **Platform Admin** | `platform-admin` | Cross-tenant governance — typically via `ai-admin-frontend`; portal exposes only authorized component subsets | `/usage` (cross-tenant view), `TenantSwitcher` |

### RBAC Enforcement

```
AuthGuard(route) →
  if !session.accessToken → redirect /login
  if route.roles && !session.user.roles.intersect(route.roles) → 403
  if tenant-bound route && !session.tenant.id → 403
```

| Guard Check | Applied To | Fallback |
|-------------|-----------|----------|
| `requireAuth` | All except `/login`, `/register` | Redirect `/login?redirect=<original>` |
| `requireRole(['tenant-admin'])` | `/settings` (write ops) | 403 `Result` page |
| `requireRole(['platform-admin','tenant-admin'])` | `/agents` (admin ops) | 403 page |
| `requireTenantBound` | `/agents/:id/*`, `/knowledge/*` | 403 + audit trace |

### Persona-Specific Menu Visibility

Menu items are filtered client-side by `session.manifest.enabledComponents`. If a component is disabled in `PlatformManifest`, its nav entry renders as `disabled` with a tooltip: "Contact your tenant admin to enable."

```typescript
// Derive menu from manifest (not hardcoded)
const navItems = useMemo(() => {
  const m = session.manifest.enabledComponents;
  return [
    { key: '/', label: 'Dashboard', icon: DashboardOutlined },
    { key: '/chat', label: 'Chat', icon: MessageOutlined },
    { key: '/agents', label: 'Agents', icon: RobotOutlined, disabled: !m.agentBuilder },
    { key: '/knowledge', label: 'Knowledge', icon: BookOutlined, disabled: !m.rag },
    { key: '/tools', label: 'Tools', icon: ToolOutlined, disabled: !m.toolRegistry },
    { key: '/models', label: 'Models', icon: ApiOutlined, disabled: !m.modelCatalog },
    { key: '/usage', label: 'Usage', icon: BarChartOutlined, disabled: !m.billing },
    { key: '/settings', label: 'Settings', icon: SettingOutlined },
  ];
}, [session.manifest]);
```

---

## §2 · Feature Modules & Route Structure

Routes organized by `react-router` with feature-level code splitting. Each route maps to a backend SPI and a design section.

### Route Table

| Route | Component (lazy) | Feature Module | SPI Backend | § Ref |
|-------|-----------------|----------------|-------------|-------|
| `/` | `DashboardPage` | Dashboard: agent count, daily calls, token consumption, health status | `ai-platform-api` (aggregation) | §4.8 |
| `/agents` | `AgentListPage` | Agent list — virtual-scroll `DataTable` | `ai-platform-api` (`AgentSpec` list) | §4.3.5 |
| `/agents/new` | `AgentBuilderPage` | **Agent Builder** — model/tool/memory/knowledge/guardrails/state-machine wizard | `ai-platform-api` (write `AgentSpec`) | §4.3.5, §4.4 |
| `/agents/:id/edit` | `AgentBuilderPage` | Same builder, populated from existing `AgentSpec` | `ai-platform-api` (read+write) | §4.3.5 |
| `/agents/:id` | `AgentDetailPage` | Agent detail: debug panel, chat test, `ChatThread` | `ai-gateway-core` (`/v1/chat/completions`) | §4.4.1 |
| `/chat` | `ChatPage` | General chat / one-click trial | `ai-gateway-core` (SSE streaming) | §13.4, §4.4 |
| `/knowledge` | `KnowledgePage` | Document upload, chunk preview, retrieval test | `ai-tool-registry`/`ragflow` via `ai-platform-api` | §4.3, §4.4.3 |
| `/tools` | `ToolListPage` | Tool / MCP registry browser, bindable to Agents | `ai-tool-registry` | §4.3.2 |
| `/models` | `ModelCatalogPage` | Model directory — card view: capability, price, health, whitelist | `ai-platform-api` (`ModelRegistry`) | §4.4.5 |
| `/models/keys` | `ModelKeysPage` | Third-party model key config (Qwen, OpenAI, Claude) | `ai-platform-api` → `ai-gateway-core` | §4.4, §12.1 |
| `/usage` | `UsagePage` | Usage/quota dashboard: Token, QPS, vectors, cost | `ai-billing-service` (optional) | §8, §14.5 |
| `/settings` | `SettingsPage` | Tenant settings: theme/branding, members, API keys | `ai-platform-api`, Keycloak | §8, §14.3 |

### Code Splitting Convention

```typescript
// Every top-level page is lazy-loaded
const DashboardPage = React.lazy(() => import('./features/dashboard/DashboardPage'));
const AgentListPage = React.lazy(() => import('./features/agents/AgentListPage'));
const AgentBuilderPage = React.lazy(() => import('./features/agents/AgentBuilderPage'));
// ...

// Route config with Suspense boundary per layout
<Routes>
  <Route element={<AppLayout />}>
    <Route index element={<Suspense fallback={<PageSkeleton />}><DashboardPage /></Suspense>} />
    <Route path="agents" element={<Suspense fallback={<PageSkeleton />}><AgentListPage /></Suspense>} />
    <Route path="agents/new" element={<Suspense fallback={<PageSkeleton />}><AgentBuilderPage /></Suspense>} />
    {/* ... */}
  </Route>
</Routes>
```

### Guarded Sub-routes (typed params)

| Route Pattern | Param Types | Guard |
|---------------|-------------|-------|
| `agents/:id` | `id: string (UUID)` | `requireAuth` + tenant-bound |
| `agents/:id/edit` | `id: string (UUID)` | `requireAuth` + `requireRole(['developer','tenant-admin'])` + tenant-bound |

---

## §4 · Critical UX Flows

### 4.1 Agent Builder Flow (Core Entry Point → AgentSpec)

The builder is the portal's defining workflow. It converges three construction paths (low-code canvas, Python LangGraph, Java Spring AI) into a single declarative `AgentSpec`.

```
Step  Sequence                                     Component           Produces
────  ───────────────────────────────────────────  ──────────────────  ──────────────────────
  1   Open /agents/new → choose template or blank  TemplatePicker       template_id
  2   Bind model(s) with fallback chain            ModelBinder          model_binding[]
  3   Bind tools from ai-tool-registry             ToolBinder           tool_bindings[]
  4   Configure memory (working + long_term)       MemoryConfig         memory_bindings[]
  5   Add knowledge base (depends on memory+VS)    KnowledgeBinder      knowledge_bindings[]
  6   Set guardrails (injection/PII/rate-limit)    GuardrailConfig      guardrails[]
  7   Visualize state machine (node/edge)          StateMachineCanvas   state_machine
  8   Preview → save as AgentSpec                  PreviewPanel         AgentSpec (final)
  9   Chat test → publish                          ChatThread           published Agent
 10   Agent appears in /agents list                AgentListPage        — (UX confirmation)
```

**Implementation contract**: Each builder step is a self-contained wizard panel that writes to a local `useAgentBuilder` Zustand store. On "Save", the store serializes to a complete `AgentSpec` object and POSTs to `ai-platform-api`.

```typescript
// application/agent-builder/useAgentBuilder.ts — Zustand store shape
interface AgentBuilderState {
  // Step state
  step: number;              // 1-10, index into builder sequence
  templateId?: string;       // null = blank start

  // Binding state (populated step-by-step, lazy order allowed)
  modelBindings: ModelBinding[];       // Step 2
  toolBindings: ToolBinding[];         // Step 3
  memoryBindings: MemoryBinding[];     // Step 4
  knowledgeBindings: KnowledgeBinding[]; // Step 5
  guardrails: GuardrailConfig;         // Step 6
  stateMachine: StateMachineSpec;      // Step 7 (node/edge graph)

  // Actions
  setStep: (n: number) => void;
  addModelBinding: (b: ModelBinding) => void;
  removeModelBinding: (id: string) => void;
  // ... per-binding add/remove/update

  // Terminal
  serializeToAgentSpec: () => AgentSpec;
  save: () => Promise<AgentSpec>;      // POST to ai-platform-api
}
```

### 4.2 Chat Trial Flow (Streaming UX)

```
User
  │
  ├─ Enter message in /chat
  │
  ▼
apiClient.stream('/v1/chat/completions', {
  method: 'POST',
  body: JSON.stringify({
    model: selectedModel,
    messages: [...history, { role: 'user', content: input }],
    stream: true,
  }),
  headers: {
    'Authorization': `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenant.id,
  },
})
  │
  ├─ ai-gateway-core routes to LLM via ModelRouter
  │
  ▼
SSE chunks arrive via ReadableStream
  │
  ▼
ChatThread component (from @openstrata/ui-kit):
  - streaming={true}
  - onChunk={appendToken}
  - components={{ mermaid, markdown, thinking, table, toolCall }}
  │
  ▼
User sees real-time incremental render
```

**Key constraint**: The SSE stream MUST be parsed with a dedicated `StreamParser` class (in `infrastructure/stream/`) that handles: chunk boundary parsing, `[DONE]` sentinel, connection interruption with auto-reconnect (exponential backoff), and `trace-id` extraction for observability.

```typescript
// infrastructure/stream/sseParser.ts — not a full impl, contract only
class SSEClient {
  private controller: AbortController;
  private retries = 0;

  async stream(path: string, body: object, onChunk: (data: string) => void): Promise<void> {
    // 1. fetch with ReadableStream reader
    // 2. decode chunks → split by '\n\n'
    // 3. parse 'data: {...}' lines → JSON.parse → onChunk
    // 4. on 'data: [DONE]' → resolve
    // 5. on network error → retry with backoff (max 3 retries)
    // 6. extract x-trace-id header → attach to span
  }
}
```

### 4.3 Session Lifecycle (Auth Flow)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│ User opens  │────▶│ AuthGuard     │────▶│ Keycloak OIDC    │
│ portal      │     │ checks token  │     │ auth code flow   │
└─────────────┘     └──────────────┘     └──────────────────┘
                            │                      │
                            │ (no token)           │ (callback)
                            ▼                      ▼
                     /login redirect       set accessToken +
                                           refreshToken in
                                           SessionContext
                                                    │
                                                    ▼
                                           fetch PlatformManifest
                                           for tenant
                                                    │
                                                    ▼
                                           render portal with
                                           capability-bound
                                           menu & routes
```

---

## Implementation-Level Decisions

| Decision | Rationale | Source |
|----------|-----------|--------|
| Agent builder uses single Zustand store (not multi-step routing) | Enables free-form navigation between steps; state is local until explicit save | §4.1 |
| `PlatformManifest` is read-only at runtime, fetched once on mount | Boundaries set by admin portal; live reload not needed | §7 |
| All components from `@openstrata/ui-kit` — no local component library | Avoids fragmentation; version pinned via `bom.yaml` | §6 |
| SSE parser is in `infrastructure/` not `application/` | Infrastructure concern; domain layer consumes parsed tokens only | §15.5.2 |
| `tenant.id` as `X-Tenant-Id` header on every request | Multi-tenant isolation; gateway uses it for routing + quota | §8 |

---

## Cross-Cutting Concerns

| Concern | Implementation Point |
|---------|---------------------|
| Auth | `AuthGuard` (route-level), `ApiClient` (request-level via `Authorization` header) |
| Tenant Isolation | `X-Tenant-Id` header, `SessionContext.tenant.id`, `manifest`-based capability gating |
| Error Boundaries | `ErrorBoundary` wraps each route; falls back to `Result` component with retry |
| Loading States | `Suspense` at route level; `Skeleton` components for lists; streaming indicator for chat |
| Empty States | `EmptyState` component from `@openstrata/ui-kit` — used for 404, empty lists, disabled features |
| Observability | All API calls traced via OTel spans; `trace-id` in SSE headers; Sentry for errors |
