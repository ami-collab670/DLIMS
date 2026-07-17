# LSIMS API Audit Library

**Last updated:** July 16, 2026

This directory contains standalone frontend–backend contract audits for every HTTP operation exposed under `/api/auth/`, `/api/accounts/`, `/api/laboratory/`, and `/api/notifications/`. Each file is written to the same template so reviewers can compare endpoints consistently.

---

## Audit documents (9 categories)

| # | Document | Base path | Operations |
|---|----------|-----------|------------|
| 1 | [accounts.md](accounts.md) | `/api/accounts/` | 25 |
| 2 | [auth.md](auth.md) | `/api/auth/` | 6 |
| 3 | [laboratory-jobs.md](laboratory-jobs.md) | `/api/laboratory/jobs/` | 7 |
| 4 | [laboratory-tests.md](laboratory-tests.md) | `/api/laboratory/tests/` | 6 |
| 5 | [laboratory-samples.md](laboratory-samples.md) | `/api/laboratory/samples/`, `sample-tests/`, `preparation-records/` | 21 |
| 6 | [laboratory-results-qc.md](laboratory-results-qc.md) | `/api/laboratory/analysis-results/`, `qc-decisions/`, `calibration-records/` | 17 |
| 7 | [laboratory-finance.md](laboratory-finance.md) | `/api/laboratory/financial-records/`, `discount-approvals/` | 14 |
| 8 | [laboratory-compliance-alerts.md](laboratory-compliance-alerts.md) | `/api/laboratory/complaints/`, `priority-alerts/` | 9 |
| 9 | [notifications.md](notifications.md) | `/api/notifications/inbox/` | 8 |

**Master checklist:** [tracker.md](tracker.md) — 113 endpoints with FE audited / BE traced / JSON verified columns.

---

## Methodology

Each audit file follows the same heading hierarchy:

1. **Title + metadata** — audit date, Swagger/JSON source notes, backend test coverage
2. **Table of Contents** — anchor links to every section
3. **Overview** — endpoint summary table (`Method | Path | Description | Used in Frontend`)
4. **Part 1: Frontend Usage** — per endpoint, sections 1–7:
   - Called in frontend?
   - Call sites (file, component, function)
   - TypeScript types (`file:line` citations)
   - Field comparison vs. real JSON (or **unclear - needs manual check**)
   - Fallback/default values
   - Error handling (`getApiErrorMessage` from [LSIMS-Frontend/src/lib/api-error.ts](../../LSIMS-Frontend/src/lib/api-error.ts))
   - Business rules with quoted code
5. **Part 2: Backend Logic** — per endpoint, sections 8–11:
   - Response construction (view, serializer, queryset)
   - Error messages (trigger, enforced in, FE displays?)
   - State machine (if applicable)
   - Permissions
6. **Consolidated Tables** — field-level, backend logic, final summary with **Backend Rule Traced** column
7. **Highest-Risk Findings** — ranked
8. **Open Questions / Needs Manual Verification**

### Part 1 vs Part 2

| Part | Question answered | Primary sources |
|------|-------------------|-----------------|
| **Part 1** | Does the frontend call this endpoint correctly? | `LSIMS-Frontend/src/features/**`, page components, shared types |
| **Part 2** | What does the backend actually enforce? | `LSIMS-Backend/LSIMS-main/**/views.py`, `serializers.py`, `urls.py` |

Part 1 and Part 2 are intentionally separate so contract gaps (email vs UUID FKs, dead exports, silent empty lists) are visible.

### JSON verification policy

- **Do not invent JSON.** Field rows are marked **unclear - needs manual check** unless real response JSON was pasted during audit or verified in backend tests.
- Only the accounts analysts list (`[]`) and several accounts endpoints had user-provided JSON at audit time.
- To close open questions: capture a live Swagger or browser-network response and update the field comparison tables in the relevant file.

### Backend test coverage

| App | Tests |
|-----|-------|
| `accounts` | [LSIMS-Backend/LSIMS-main/accounts/tests.py](../../LSIMS-Backend/LSIMS-main/accounts/tests.py) — comprehensive Sprint 1 suite |
| `laboratory`, `notifications` | [LSIMS-Backend/LSIMS-main/laboratory/tests/](../../LSIMS-Backend/LSIMS-main/laboratory/tests/) — permission, happy-path, workflow tests (not endpoint-by-endpoint catalog) |

---

## Related documentation

- [frontend-api-reference.md](../frontend-api-reference.md) — endpoint catalog and FE module index (not a contract audit)
- [DEMO.md](../../DEMO.md) — demo walkthrough
- Swagger UI: `/api/docs/` (browser only; not audited here)
- OpenAPI schema: `/api/schema/` (browser only)

---

## How to extend an audit

1. Find the endpoint row in [tracker.md](tracker.md).
2. Open the linked audit file and locate the endpoint section.
3. Paste verified JSON into section 4 (field comparison); change verdicts from **unclear** to **OK** / **MISSING** / **UNUSED**.
4. Update **JSON verified** column in `tracker.md` to **Yes**.
5. Remove resolved items from **Open Questions** in that file.

---

## Cross-cutting themes (library-wide)

These recur across multiple audit files:

1. **Email vs UUID for FK fields** — client/job/notification recipient and analyst assignment pickers often use email as `<option value>` while some serializers use `PrimaryKeyRelatedField`.
2. **Silent empty dropdowns** — `useQuery` defaults to `= []` without surfacing `isError`.
3. **Page-1-only list fetches** — roles, departments, and other paginated pickers do not iterate pages.
4. **Dead API exports** — GET-by-id and PUT helpers exported but never imported by pages.
5. **Read-only workflow fields on PATCH** — job status, cancellation, QC/decision states changed via dedicated `@action` routes, not generic PATCH.

See each file's **Highest-Risk Findings** for endpoint-specific detail.
