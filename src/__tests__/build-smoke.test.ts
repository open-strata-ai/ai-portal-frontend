import { describe, it, expect } from "vitest";
import { apiClient } from "../infrastructure/apiClient";

// Build-time smoke test (Batch D2/K1). The production build (`tsc && vite build`)
// already type-checks every page (Agent builder, catalog, chat, monitoring); this
// test confirms the shared API client module loads and is wired correctly.
describe("portal-frontend apiClient", () => {
  it("exports a configured axios instance", () => {
    expect(apiClient).toBeDefined();
    expect(typeof apiClient.get).toBe("function");
    expect(typeof apiClient.post).toBe("function");
  });
});
