# Staging readiness report

As of 2026-10-15 (Asia/Dubai). **NO-GO for migrations, test-data writes and deployment.** This is an evidence report, not a launch approval.

| Item | Verified status |
| --- | --- |
| Actual staging website URL | **None deployed** |
| Supabase target | `xhogffnpjaoxkgoiwcty` (Taawun), owner-selected **provisional** staging candidate |
| Candidate state/data safety | INACTIVE; existing data, former production use and recoverability **unknown** |
| Original project | `fvnemfbqpmweqzhzuflu`, leave untouched; initial metadata access was denied |
| Repository | Development branch pushed; `main` remains `7bcc61a8db4174867ea99feeecefc0d3bb2080dd` |
| Independent clean-clone CI | **Passed** at `bbb6c5b09a5b1d8d809ea42e63be2463c6d68b39`, [run 38733865686](https://github.com/hash4444/taawun/actions/runs/38733865686) |
| CI details | Ubuntu 24.04, checkout + npm ci, browser install, TypeScript/ESLint/build, 147 Vitest, 7 Deno, 24 Playwright, npm audit all succeeded |
| Local staging-preparation validation | Full checks passed again: **147 Vitest tests in 21 files**, 7 Deno, 24 browser checks; the additional 17 tests exercise only offline fixture/safety/preflight behavior |
| CLI connection / backup read | Normal owner-approved login succeeded. Authenticated inventory returned no listed backups or physical recovery boundaries; PITR disabled, WAL-G flag enabled. A retained paused-project archive and recoverability remain unconfirmed |
| Actual PR | **Not created**; connected integration still returns 403; body and compare link prepared in `PULL_REQUEST.md` |
| Live integration tests | **Not run**; inactive/unknown-data target and unapproved mutations are explicit blockers |
| Failed inspection | Read-only candidate table listing timed out; this is not a failing application test or evidence of zero rows |

The push trigger is limited to `codex/student-marketplace` and runs tests only with read-only repository permissions. It contains no deployment, cloud credentials or live staging test actions. The first successful CI result above is commit-specific; consult [latest branch runs](https://github.com/hash4444/taawun/actions?query=branch%3Acodex%2Fstudent-marketplace) for subsequent pushed commit status. A passing synthetic preflight test is not a real staging preflight result.

## Integration outcomes

| Real infrastructure test | Outcome / blocker |
| --- | --- |
| Student/employer signup, login and password recovery | Not run; no approved active staging Auth environment/test accounts |
| Employer verification and trusted admin review | Not run; staging users, trusted operator and private document storage not authorized/configured |
| Posting, applying, interview, offer and acceptance | Not run; no approved synthetic-data write environment |
| Separate-account database/storage authorization | Not run; actual schema/grants cannot be inspected while inactive |
| Email delivery and Google/Microsoft sign-in callbacks | Not run; SMTP/provider configuration, controlled inboxes and approved HTTPS callback origin needed |
| Manual/ICS availability on real database | Not run; local/mock checks pass but are not hosted integration evidence |
| Direct calendar connection/refresh/revocation | Not ready to enable; only read-only provider adapters are prepared |
| AI approval, duplicates and daily quotas on hosted RPCs | Not run; requires approved synthetic profiles/jobs and deployed functions/schema |
| HTTPS/SPA/CSP/cache/mobile/desktop staging website | Not run; no approved host, access-control policy, deployment authorization or URL |
| Error monitoring | No staging monitor deployed; choose privacy-safe host/app monitoring with approved data handling/budget before launch |

## Security findings and bugs

- No additional application regression is established by this preparation task. Passing fixture/PGlite tests cannot close hosted authorization risks or prove historical role grants are safe.
- The migration is structurally additive but changes existing RLS/grants, role data, defaults and Storage behavior. It must not be applied blindly to an unknown data-bearing project. Review `MIGRATION_IMPACT_REPORT.md` against the hosted catalog and take verified recovery copies first.
- Existing production/test classification and recoverability are unknown. The authenticated backup-list response returned no entries; it does not independently rule out a retained paused-project archive. Inactivity is not proof that a project is empty or disposable.
- Stored source confirms the two deployed version-1 hunters do check cron secrets, but their per-user paths use legacy service-role/paid-provider behavior without the new role, consent, quota or timetable safeguards. Job Hunter can automatically write applications under legacy settings; Candidate Hunter can mark outreach without delivery evidence. Current credentials/schedules/runtime usage remain unknown. Review and separately authorize containment before any resume; SQL-only changes would not replace these handlers. No handler was invoked.
- PR creation is blocked at the integration credential boundary. Repository admin/push metadata and workflow permissions do not prove connector PR-write permission.
- Direct calendar OAuth lifecycle, retention/deletion operations, additional browsers/assistive technology and load/real-device performance remain known gaps from `TEST_REPORT.md`.

## Required owner actions and next gate

1. CLI sign-in and the read-only backup inventory are complete. Check the candidate's Dashboard Project Overview/backup recovery notices without selecting Resume, Restore or Download. Establish pause date, retained archive dates/status, offered database/Storage recovery path and independent exports. If no archive metadata is shown, obtain Supabase confirmation of retained pause archives before approving activation. Share metadata only, never tokens or personal records in chat.
2. Authorize a narrow recovery/inspection path after that check: prefer an isolated inspection of an existing backup where available; otherwise separately approve inspection-only resume after reviewing recovery eligibility, integrations and cost implications. No migration/deployment approval is implied.
3. Establish actual data inventory, prior usage and recoverability. If important data exists or classification stays uncertain, keep this candidate intact and obtain separate approval for an isolated synthetic-data staging environment.
4. Resolve GitHub PR permission or create the prepared draft in GitHub's authenticated UI. Do not merge.
5. Only after the project is confirmed safe, separately authorize migrations/functions/test-data writes and choose an access-controlled HTTPS host, callback domains, SMTP/providers and monitoring. Public deployment and paid services require explicit approval.

**Recommendation:** continue review and preparation; do not mutate the provisional project or launch. See `SUPABASE_PROJECT_RECONCILIATION.md`, `MIGRATION_IMPACT_REPORT.md`, `STAGING_INTEGRATION_PLAN.md` and `LAUNCH_CHECKLIST.md` for the specific gates and evidence still needed.
