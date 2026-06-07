---
phase: 1
slug: monorepo-local-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `@cucumber/cucumber` v13.0.0 |
| **Config file** | `tests/bdd/cucumber.js` |
| **Quick run command** | `node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js tests/bdd/features/` |
| **Full suite command** | `node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js tests/bdd/features/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js tests/bdd/features/`
- **After every plan wave:** Run `node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js tests/bdd/features/`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | F1.1, F1.2, F1.3 | — | N/A | unit | `pnpm lint && pnpm typecheck` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | TS-07, F1.4, F1.5 | — | N/A | integration | `node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js tests/bdd/features/health.feature` | ❌ W0 | ⬜ pending |
| 01-02-01 | 01 | 2 | F1.6, F1.7, F1.8 | — | N/A | integration | `node --import tsx node_modules/@cucumber/cucumber/bin/cucumber.js tests/bdd/features/db.feature` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/bdd/cucumber.js` — BDD config
- [ ] `tests/bdd/features/health.feature` — Smoke test to verify service statuses
- [ ] `tests/bdd/features/db.feature` — Test migration & seeding status
- [ ] `infra/docker/test.Dockerfile` — Integration test container

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

