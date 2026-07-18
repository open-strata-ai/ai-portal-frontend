# ADR-0004: `AgentSpec` front-end Schema verification

- **Status**: Pending (Open)
- **Date**: 2026-07-17
- **Suggested by**: OpenStrata Architecture Group
- **Repository**: ai-portal-frontend
- **Source**: `docs/DESIGN.md` §11 Open Issue
- **Associations**: `ai-admin-frontend`, `ai-ui-kit`

##Context

Whether it is generated from the same source as the OpenAPI/AgentSpec schema of `specs/` (to avoid double maintenance). 5. How does `platform-admin` cross-tenant switching share the `TenantSwitcher` component between `ai-portal-frontend` and `ai-admin-frontend` (withdraw `ai-ui-kit`?). ---

## Decision Options (Options Considered)

1. **Maintain status quo / conservative default**: Maintain current behavior, controlled by configuration switches or explicit parameters, and do not introduce destructive changes.
2. **Unified implementation after cross-repository alignment**: Make a clear contract with the relevant services (`ai-admin-frontend, ai-ui-kit`) before implementation.
3. **Phased introduction**: Leave a placeholder/default switch in the current stage, and solidify it in subsequent stages after the dependent capabilities are ready (see Related Architecture §).

## Recommended decision (Decision)

This ADR solidifies "`AgentSpec` front-end Schema verification" into an architectural decision record and incorporates it into `docs/adr/` for continuous tracking. This issue stems from the `docs/DESIGN.md` §11 open issue and is still open.

**Conservative Default Principle**: Before the final decision is made, the "minimum available + explicit configuration switch" shall prevail, maintain the current behavior, and not destroy the existing contract and cross-repository SPI interface; this ADR status will be written back after review by the relevant team.



## To be aligned / Follow-ups (Follow-ups)

- Alignment confirmation with `ai-admin-frontend`: clarify responsibility boundaries/interface contracts/data flow direction to avoid double writing or semantic drift.
- Alignment confirmation with `ai-ui-kit`: clarify responsibility boundaries/interface contracts/data flow direction to avoid double writing or semantic drift.
- Solidify the decision before the review at the corresponding stage, and write the final conclusion back into this ADR (the status is changed from "Pending" to "Adopted").

## Traceback

- Upstream design: `docs/DESIGN.md` §11 Open issue
- Relevance index: see `docs/adr/README.md`
