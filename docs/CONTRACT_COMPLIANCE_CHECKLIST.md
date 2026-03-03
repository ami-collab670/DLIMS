# ⚖️ LSIMS Sprint Delivery & Contract Compliance Checklist

**Objective:** Ensure every sprint submission meets the exact legal and technical requirements stipulated in the "Professional Service Contract Agreement" (Sections 7, 8, and 13) to guarantee acceptance and payment.

---

## Phase 1: Codebase & Testing (AI Verification)
*AI Assistant: Review the current sprint's code against these criteria before finalizing the sprint.*

- [ ] **Database & Migrations (Sec 7):** Are all new models properly defined, and have `makemigrations` and `migrate` been run? Are migration files included in the commit?
- [ ] **RBAC Enforcement (Sec 8):** Are Django Rest Framework (DRF) permission classes actively protecting every new endpoint? (e.g., Analysts cannot access Admin endpoints).
- [ ] **Unit Tests Passing (Sec 7 & 8):** Does `python manage.py test` return an `OK` status with 0 failures? Are there tests explicitly covering Auth, Permissions, and Edge Cases?
- [ ] **Code Commenting (Sec 5.IV):** Is the code adequately commented to explain complex business logic (e.g., Signals, State changes) for future handoff?
- [ ] **No Critical Bugs (Sec 8):** Does the happy-path logic execute without throwing `500 Internal Server Error`?

## Phase 2: Documentation (AI + Developer)
*AI Assistant: Generate the required documentation artifacts based on the sprint's work.*

- [ ] **API Documentation (Sec 6 & 7):** Is `drf-spectacular` properly configured to auto-generate the Swagger/OpenAPI docs for all new endpoints at `/api/docs/`?
- [ ] **Sprint Report (Sec 7):** Has a Markdown Sprint Report been generated summarizing:
    1. Completed tasks & features.
    2. Test coverage results.
    3. Known limitations (if any).
- [ ] **Open-Source Disclosure (Sec 13):** Is the `requirements.txt` file updated with all new packages to comply with open-source license disclosure?

## Phase 3: Deployment & Handoff (Developer Manual Action)
*Developer: Execute these final steps to fulfill the delivery mechanics.*

- [ ] **Version Control (Sec 13):** Has all code been committed and pushed to the shared GitHub repository? (`git push origin main`)
- [ ] **Staging Environment (Sec 7):** Is the current `main` branch deployed to the live staging server (e.g., Render, Railway, DigitalOcean)?
- [ ] **Delivery Email (Sec 9):** Has the formal "Sprint Delivery" email been sent to the Contractor containing:
    1. The Sprint Report PDF.
    2. The link to the Staging API Swagger UI.
    3. The link to the GitHub commit.
    4. The invoice for 20,000 ETB.

---
**Acceptance Gate:** If all boxes are checked, the sprint is legally delivered per Section 9 of the agreement, triggering the 5-working-day payment window.