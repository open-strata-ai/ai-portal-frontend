# ADR-0002: Single tenant without Keycloak

- **Status**: Pending (Open)
- **Date**: 2026-07-17
- **Suggested by**: OpenStrata Architecture Group
- **Repository**: ai-portal-frontend
- **Source**: `design/DESIGN.md` §11 Open Issue
- **Association**: `ai-gateway-core`

##Context

How to align the login state with the API Key mode of `ai-gateway-core`? Do you need a local lightweight auth stub.

## Decision Options (Options Considered)

1. **Maintain status quo / conservative default**: Maintain current behavior, controlled by configuration switches or explicit parameters, and do not introduce destructive changes.
2. **Unified implementation after cross-repository alignment**: Make a clear contract with the relevant service (`ai-gateway-core`) before implementation.
3. **Phased introduction**: Leave a placeholder/default switch in the current stage, and solidify it in subsequent stages after the dependent capabilities are ready (see Related Architecture §).

## Recommended decision (Decision)

This ADR solidifies "single tenant without Keycloak" as an architectural decision record and includes it in `design/adr/` for continuous tracking. This issue stems from the `design/DESIGN.md` §11 open issue and is still open.

**Conservative Default Principle**: Before the final decision is made, the "minimum available + explicit configuration switch" shall prevail, maintain the current behavior, and not destroy the existing contract and cross-repository SPI interface; this ADR status will be written back after review by the relevant team.



## To be aligned / Follow-ups (Follow-ups)

- Alignment confirmation with `ai-gateway-core`: clarify responsibility boundaries/interface contracts/data flow direction to avoid double writing or semantic drift.
- Solidify the decision before the review at the corresponding stage, and write the final conclusion back into this ADR (the status is changed from "Pending" to "Adopted").

## Traceback

- Upstream design: `design/DESIGN.md` §11 Open issue
- Relevance index: see `design/adr/README.md`
