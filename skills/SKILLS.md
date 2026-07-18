# ai-portal-frontend · Encoding rules (SKILLS)

> **auto-generated from `design/DESIGN.md`** — concrete coding rules for AI agents working on this repository. Each rule is actionable and testable.

---

## Rule Group A · State Management (§3)

### A1 — Use Zustand for Feature Stores

Every feature gets ONE Zustand store in `application/<feature>/`, never Redux or React Context for mutable state. Stores follow the common shape:

```typescript
// application/<feature>/use<Feature>.ts
interface <Feature>State {
  // Data
  items: Item[];
  selectedId?: string;
  loading: Record<string, boolean>;  // keyed by operation name

  // Derived flags (use selectors, not stored)
  // e.g., hasChanges, isDirty, canSave

  // Actions — always named as verbs
  fetchAll: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  create: (data: CreateDTO) => Promise<Item>;
  update: (id: string, data: UpdateDTO) => Promise<Item>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}
```

**Rule**: Store file exports `create<Feature>Store` factory function (for test isolation) AND a default singleton hook `use<Feature>Store`. Import the hook in components, call the factory in tests.

**Rule**: `loading` state is always a `Record<string, boolean>`, keyed by operation. Components read `loading['fetchAll']`, not a single boolean. This prevents unrelated operations from clobbering each other's spinners.

**Rule**: Never store derived values in the store. Use Zustand selectors or `useMemo` in components. Example: `const agentCount = useAgentStore(s => s.agents.length)`.

### A2 — Global State via SessionContext (React Context)

Only TWO pieces of state belong in React Context, everything else in Zustand:

```
React Context         Zustand Stores (per feature)
─────────────────     ─────────────────────────────
SessionContext         useAgentBuilder
  - user                useChatSession
  - tenant              useKnowledgeStore
  - manifest            useToolStore
  - accessToken         useModelStore
                        useUsageStore
```

**Rule**: `SessionContext` is provided once at the root by `AuthProvider`. No component creates a nested provider. Consumer: `const session = useContext(SessionContext)` — no need for custom hook wrapping.

**Rule**: `manifest` in `SessionContext` is READ-ONLY. Never mutate it. Features that need to react to manifest changes subscribe to the context and re-derive their UI on change.

### A3 — Domain Layer is Pure Types + Port Interfaces

```typescript
// domain/agent/AgentPort.ts — PORT (interface), no imports from infrastructure/
export interface AgentPort {
  listAgents(tenantId: string): Promise<AgentSummary[]>;
  getAgent(tenantId: string, id: string): Promise<AgentSpec>;
  createAgent(tenantId: string, spec: AgentSpec): Promise<AgentSpec>;
  updateAgent(tenantId: string, id: string, spec: AgentSpec): Promise<AgentSpec>;
  deleteAgent(tenantId: string, id: string): Promise<void>;
}

// infrastructure/AgentAdapter.ts — ADAPTER (implements Port)
export class AgentAdapter implements AgentPort {
  constructor(private client: ApiClient) {}
  async listAgents(tenantId: string) { return this.client.get('/agents'); }
  // ...
}
```

**Rule**: `domain/` files NEVER import from `infrastructure/` or `application/`. They ONLY import from `domain/` (types, Ports) or shared libs.

**Rule**: Every Port interface has exactly ONE adapter implementation in `infrastructure/`. Store constructors accept the Port as a dependency for testability.

### A4 — Data Flow Direction (Compile-Time)

```
components/  ──import──▶  application/  ──import──▶  domain/
                                                         ▲
                              infrastructure/  ──import──┘
```

**Rule**: Any violation of this direction is a compile-time error. CI enforces via `eslint-plugin-boundaries` (configured with the layers above). Circular imports between layers are blocked.

---

## Rule Group B · API Integration (§5)

### B1 — Single ApiClient Class

```typescript
// infrastructure/apiClient.ts
export class ApiClient {
  constructor(private baseUrl: string, private session: SessionContext) {}

  async get<T>(path: string, params?: Record<string, string>): Promise<T>;
  async post<T>(path: string, body: unknown): Promise<T>;
  async put<T>(path: string, body: unknown): Promise<T>;
  async delete(path: string): Promise<void>;
  async stream(path: string, body: unknown): Promise<SSEClient>;
}
```

**Rule**: Every HTTP request goes through `ApiClient`. NEVER call `fetch()` directly in stores or components. The client auto-injects:
- `Authorization: Bearer <accessToken>`
- `X-Tenant-Id: <tenant.id>`
- `Content-Type: application/json`

**Rule**: `ApiClient` is a singleton created in `infrastructure/index.ts` and injected into all adapters.

### B2 — Error Normalization

All HTTP errors are normalized to `AppError` with a single `normalizeError(res: Response)` method:

```typescript
export interface AppError {
  code: number;           // HTTP status
  message: string;        // User-safe message (never raw server error)
  tenantSafe: boolean;    // false = contains internals, never shown to user
  details?: Record<string, string[]>; // Field-level errors for 422
}
```

**Rule**: Stores catch `AppError` and map to form-level or field-level state. Components render from store's `error` state, never from raw catch blocks.

**Rule**: `tenantSafe=false` errors are sent to Sentry but NOT displayed. The UI shows a generic "Something went wrong" with a retry button.

**Rule**: Specific HTTP codes → specific UX (table from DESIGN.md §5.4):

| Code | UX Action |
|------|-----------|
| 401 | Silent token refresh → retry. If refresh fails → redirect `/login` |
| 403 | `<Result status="403" />` page with audit trail ID |
| 404 | `<EmptyState />` component |
| 409 | Inline form error under the conflicting field |
| 422 | Field-level errors aligned with `AgentSpec` schema validation |
| 429 | Toast notification + exponential backoff (1s, 2s, 4s) |
| 5xx | `ErrorBoundary` catch → report → "Retry" button |

### B3 — SSE Streaming Contract

**Rule**: Stream via `ApiClient.stream()` which returns an `SSEClient` instance. Components call `sseClient.consume(onChunk, onDone, onError)`.

**Rule**: Streaming state is managed in `useChatSession` store:

```typescript
interface ChatSessionState {
  messages: ChatMessage[];
  streaming: boolean;
  currentStreamId?: string;
  error?: AppError;

  send: (content: string, modelId: string) => Promise<void>;
  abort: () => void;
  clear: () => void;
}
```

**Rule**: `abort()` calls `AbortController.abort()` on the active SSE connection. The controller is created per `send()` call and stored in the store for cleanup on unmount (via `useEffect` return).

---

## Rule Group C · Multi-Tenant UI (§7)

### C1 — Theme Injection

```typescript
// Application root — ConfigProvider reads from SessionContext
function App() {
  const { tenant } = useContext(SessionContext);
  const themeToken = useMemo(() => ({
    colorPrimary: tenant.theme?.primaryColor ?? '#1677ff',
    borderRadius: 6,
  }), [tenant.theme]);

  return (
    <ConfigProvider theme={{ token: themeToken }}>
      <AppLayout />
    </ConfigProvider>
  );
}
```

**Rule**: `TenantTheme` from `manifest.theme` drives `ConfigProvider.theme.token`. When `tenant.theme` is undefined (single-tenant mode, no branding), fall back to platform default tokens.

**Rule**: Logo is injected via `ConfigProvider`'s `theme.components?.Layout?.triggerBg` or a dedicated `<AppLogo src={tenant.theme?.logo} />` component that falls back to the platform logo.

### C2 — Tenant Switcher (Platform-Admin Only)

**Rule**: `TenantSwitcher` renders ONLY when `session.user.roles.includes('platform-admin')`. For all other roles, the current tenant name is displayed as a static badge (no dropdown).

```typescript
function TopBar() {
  const session = useContext(SessionContext);
  const isPlatformAdmin = session.user.roles.includes('platform-admin');

  return (
    <Header>
      {isPlatformAdmin ? (
        <TenantSwitcher     // Select dropdown → changes session.tenant.id
          tenants={session.visibleTenants}
          current={session.tenant}
          onChange={(tenantId) => switchTenant(tenantId)}
        />
      ) : (
        <TenantBadge name={session.tenant.name} />
      )}
    </Header>
  );
}
```

**Rule**: On tenant switch: (1) update `SessionContext.tenant`, (2) re-fetch manifest for new tenant, (3) invalidate ALL Zustand stores by calling their `.reset()` methods, (4) navigate to `/` (dashboard).

### C3 — Capability Gating (Manifest-Driven)

**Rule**: Every route and card that depends on an enabled component reads `session.manifest.enabledComponents.<componentKey>`. Disabled items render grayed-out with a tooltip — never hidden (discoverability).

```typescript
// Common pattern: gated section in a page
function SettingsPage() {
  const { manifest } = useContext(SessionContext);

  return (
    <Page>
      <Section title="API Keys" alwaysEnabled />
      <Section
        title="Knowledge Base"
        enabled={manifest.enabledComponents.rag}
        disabledMessage="Knowledge base is not enabled for your tenant. Contact your admin."
      />
    </Page>
  );
}
```

### C4 — Quota Display (§7.3)

**Rule**: Quota is displayed as a 4-quadrant card for each resource type (Token, QPS, Vectors, Models, Cost):

```
┌─────────────────────────────────────┐
│  Token Usage           80% · 32k/40k│
│  ████████████████████░░░░  [Warning]│
│  Allocated: 40k  |  Used: 32k       │
│  Isolation: tenant-x | Billing: ¥200│
└─────────────────────────────────────┘
```

**Rule**: Quota data source depends on deployment tier:

| Tier | Token Data | QPS Data | Vector Data | GPU Data |
|------|-----------|----------|-------------|----------|
| Starter | `ai-billing-service` (optional) | Gateway metrics | N/A | N/A (hidden) |
| Standard | `ai-billing-service` | Gateway metrics | Milvus/Qdrant stats | N/A (hidden) |
| Advanced | Metering + billing | Gateway metrics + Kueue | Milvus stats | N/A (hidden) |
| Full | Metering + billing | Gateway metrics + Kueue | Milvus stats | Kueue allocation |

**Rule**: GPU quota columns and charts are gated by `manifest.enabledComponents.selfHostedInference`. When disabled, the GPU section renders as "Available in Enterprise plan" placeholder — never shows zero/missing data (which would look like a bug).

### C5 — Multi-Tenant User Invitation

**Rule**: Member invitation in `/settings` calls `POST /api/members/invite` with `{ email, role: 'developer' | 'viewer' }`. The backend (via Keycloak) sends an email; frontend shows the invitation status (pending/accepted/expired) in a table. Expired invitations can be re-sent via the same endpoint.

---

## Cross-Cutting Rules

| Rule ID | Description |
|---------|-------------|
| CC1 | Every component that fetches data MUST handle loading, error, and empty states |
| CC2 | `ErrorBoundary` wraps every top-level page; fallback is `Result` with "Retry" |
| CC3 | All user-facing strings in `i18n/` dictionary; no hardcoded strings in JSX |
| CC4 | `aria-label` on every interactive element; chat area uses `role="log" aria-live="polite"` |
| CC5 | Support `prefers-reduced-motion` — disable animations when set |
| CC6 | `@openstrata/ui-kit` is the ONLY component library source; version pinned in `bom.yaml` |
| CC7 | Lazy-load all route-level components via `React.lazy()` |
| CC8 | `DataTable` always uses virtual scrolling (TanStack Virtual) for lists > 100 items |
