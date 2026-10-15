# Staging readiness report

As of 2026-10-15 (Asia/Dubai), after owner restoration. **Empty candidate verified; migrations, test-data writes and deployment await explicit approval. NO-GO for launch.** This is an evidence report, not a launch approval.

| Item | Verified status |
| --- | --- |
| Actual staging website URL | **None deployed** |
| Supabase target | `xhogffnpjaoxkgoiwcty` (Taawun), owner-selected **provisional** staging candidate |
| Candidate state/data safety | ACTIVE_HEALTHY; exact inventory: 0 Auth users, all 24 public tables empty, 0 Storage object metadata rows. Historical use/recoverability remain unproved |
| Original project | `fvnemfbqpmweqzhzuflu`, leave untouched; initial metadata access was denied |
| Repository | Development branch pushed; `main` remains `7bcc61a8db4174867ea99feeecefc0d3bb2080dd` |
| Independent clean-clone CI | **Passed** at `3a2010326bea09f3995244e0855510cf1dc8672c`, [run 38736434036](https://github.com/hash4444/taawun/actions/runs/38736434036) |
| CI details | Ubuntu 24.04, checkout + npm ci, browser install, TypeScript/ESLint/build, 147 Vitest, 7 Deno, 24 Playwright, npm audit all succeeded |
| Local staging-preparation validation | Full checks passed again: **147 Vitest tests in 21 files**, 7 Deno, 24 browser checks; the additional 17 tests exercise only offline fixture/safety/preflight behavior |
| CLI connection / backup read | Normal owner-approved login succeeded. Authenticated inventory returned no listed backups or physical recovery boundaries; PITR disabled, WAL-G flag enabled. A retained paused-project archive and recoverability remain unconfirmed |
| Actual PR | **Not created**; connected integration still returns 403; body and compare link prepared in `PULL_REQUEST.md` |
| Hosted read-only inspection | Complete: schema/history/grants/RLS, aggregates, storage/automation metadata and advisors reviewed. See `RESTORED_PROJECT_INVENTORY.md` and hosted reviews |
| Migration drift | Six July history entries differ from repo versions; CV `file_url` missing; marketplace security migration not applied. Forward adoption plan required |
| Adoption preparation | Reviewed six historical + two pending files preserved in `deployment/staging/xhogffnpjaoxkgoiwcty`; local PGlite replay passed all 15 structural/ACL assertions, with exact hashes recorded. No remote dry run/apply occurred |
| Live workflow integration tests | **Not run**; migrations, function rollout and synthetic account/workflow writes remain unapproved |
| Earlier failed inspection | Initial inactive-project table listing timed out; post-restoration read-only inspection now succeeds |

The push trigger is limited to `codex/student-marketplace` and runs tests only with read-only repository permissions. It contains no deployment, cloud credentials or live staging test actions. The first successful CI result above is commit-specific; consult [latest branch runs](https://github.com/hash4444/taawun/actions?query=branch%3Acodex%2Fstudent-marketplace) for subsequent pushed commit status. A passing synthetic preflight test is not a real staging preflight result.

## Integration outcomes

| Real infrastructure test | Outcome / blocker |
| --- | --- |
| Student/employer signup, login and password recovery | Not run; no approved account creation or controlled test inboxes |
| Employer verification and trusted admin review | Not run; staging users, trusted operator and private document storage not authorized/configured |
| Posting, applying, interview, offer and acceptance | Not run; no approved synthetic-data write environment |
| Separate-account database/storage authorization | Catalog review complete; separate-account behavior not tested because no approved test accounts/migrations |
| Email delivery and Google/Microsoft sign-in callbacks | Not run; SMTP/provider configuration, controlled inboxes and approved HTTPS callback origin needed |
| Manual/ICS availability on real database | Not run; local/mock checks pass but are not hosted integration evidence |
| Direct calendar connection/refresh/revocation | Not ready to enable; only read-only provider adapters are prepared |
| AI approval, duplicates and daily quotas on hosted RPCs | Not run; requires approved synthetic profiles/jobs and deployed functions/schema |
| HTTPS/SPA/CSP/cache/mobile/desktop staging website | Not run; no approved host, access-control policy, deployment authorization or URL |
| Error monitoring | No staging monitor deployed; choose privacy-safe host/app monitoring with approved data handling/budget before launch |

## Security findings and bugs

- No additional application regression is established by this preparation task. Passing fixture/PGlite tests cannot close hosted authorization risks or prove historical role grants are safe.
- The migration is structurally additive but changes existing RLS/grants, role data, defaults and Storage behavior. It must not be applied blindly to an unknown data-bearing project. Review `MIGRATION_IMPACT_REPORT.md` against the hosted catalog and take verified recovery copies first.
- The current application/Auth/Storage metadata inventory is empty by exact queries. Previous production/test classification and recoverability remain unknown. The authenticated backup-list response still returns no entries after restoration; it does not independently rule out a retained paused-project archive.
- Stored source confirms the two deployed version-1 hunters do check cron secrets, but their per-user paths use legacy service-role/paid-provider behavior without the new role, consent, quota or timetable safeguards. Job Hunter can automatically write applications under legacy settings; Candidate Hunter can mark outreach without delivery evidence. Current credentials/schedules/runtime usage remain unknown. Review and separately authorize containment before any resume; SQL-only changes would not replace these handlers. No handler was invoked.
- PR creation is blocked at the integration credential boundary. Repository admin/push metadata and workflow permissions do not prove connector PR-write permission.
- Direct calendar OAuth lifecycle, retention/deletion operations, additional browsers/assistive technology and load/real-device performance remain known gaps from `TEST_REPORT.md`.

## Required owner actions and next gate

1. Review the empty current inventory and hosted drift reports. The owner already restored the project; no further resume is needed. No listed recovery point was verified, so preserve actual schema/history/configuration before changes and keep recovery limitations explicit.
2. Approve or decline the concrete history-preserving staging adoption/rollout proposal: forward CV compatibility, reviewed security schema and coordinated safe function replacement. Do not authorize a blind reset/history repair or replay of old repository migrations.
3. Separately confirm synthetic test-data/account writes and provide controlled test inboxes. Recheck counts/schema immediately before the approved rollout and stop on new records or unexpected drift. Past usage remains unattributed; no claim of historical production emptiness is made.
4. Resolve GitHub PR permission or create the prepared draft in GitHub's authenticated UI. Do not merge.
5. Only after the project is confirmed safe, separately authorize migrations/functions/test-data writes and choose an access-controlled HTTPS host, callback domains, SMTP/providers and monitoring. Public deployment and paid services require explicit approval.

**Recommendation:** this empty current project is a reasonable synthetic-data staging candidate once the owner approves the reviewed adoption plan and recovery precautions. Do not mutate it before that approval or launch it publicly. See `RESTORED_PROJECT_INVENTORY.md`, `HOSTED_SCHEMA_REVIEW.md`, `HOSTED_OPERATIONS_REVIEW.md` and `STAGING_INTEGRATION_PLAN.md` for the specific evidence and remaining gates.
