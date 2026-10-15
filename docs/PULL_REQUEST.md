# Prepared draft pull request

Repository: `hash4444/taawun`. Head: `codex/student-marketplace`. Base: `main`. Draft: yes. No merge requested.

Suggested title: **Build student-first marketplace and validate staging readiness**

TAAWUN's existing account/hiring flows had inconsistent role and verification state and unsafe authorization boundaries. The branch implements trusted roles, reviewer-backed verification, saved student profiles, four student destinations, UAE/AED discovery/posting, ownership-checked hiring decisions, private CVs, optional manual/ICS calendars and approval-based application preparation. Employer matching uses private schedule fit only with explicit availability-sharing consent.

Security work includes bounded public summaries, transactional application rules, durable quotas/notifications/audit records, secure function authentication and an additive schema migration with significant authorization/data behavior changes. Paid AI, cron, automatic/external submissions and legacy financial modules remain disabled by default. Read `docs/MIGRATION_IMPACT_REPORT.md` before authorizing any migration.

Validation actually executed: local frontend/Edge TypeScript, ESLint, production build, 147 Vitest tests (130 application regressions plus 17 offline staging harness checks), 7 mocked Deno handler tests, 24 desktop/mobile Chromium browser tests and zero known npm audit vulnerabilities. Independent clean-clone GitHub [run 38731841976](https://github.com/hash4444/taawun/actions/runs/38731841976) passed the original 130/7/24 suite at commit `96af52b1ada75fa1ff97dc404071f1fc52bcfcb7`. Browser HTTP fixtures and substitute Auth/Storage schemas do not prove real Supabase integration. Later commit status must be checked separately.

The owner selected `xhogffnpjaoxkgoiwcty` as provisional staging only. It is inactive; schema/data and recoverability remain unverified. Owner-approved normal CLI sign-in succeeded, and an authenticated backup inventory returned no entries or physical recovery boundaries, with PITR disabled. A retained paused-project archive is neither verified nor ruled out. No resume, migration, reset, deletion, cloud deployment, public hosting or paid service is authorized. The original `fvnemfbqpmweqzhzuflu` must remain untouched. Real multi-account Auth/PostgREST/Storage, email/OAuth, provider lifecycle and hosting validation remain blocked by the explicit data-safety/authorization gates in `docs/SUPABASE_PROJECT_RECONCILIATION.md` and `docs/STAGING_INTEGRATION_PLAN.md`.

## Creation blocker

Creation through the connected GitHub integration returned HTTP 403 with `Resource not accessible by integration`, including a fresh attempt on 2026-10-15. No PR was created. Repository metadata reports a public repository, administrative/push access and creation policy `all`; those fields do not reveal the integration token's installation grants.

[GitHub troubleshooting](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api#resource-not-accessible) associates this error with insufficient token permissions. [Create a pull request](https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request) requires **Pull requests: write** for supported fine-grained credentials. The exact missing/unapproved app grant cannot be inspected through the available tools. Workflow `GITHUB_TOKEN` permissions do not change the connector credential.

Owner action: review the GitHub connection/app installation for this repository and approve/reconnect the required PR permission if offered. If the integration does not request that capability, use GitHub's own authenticated UI to create a draft from the [prepared compare view](https://github.com/hash4444/taawun/compare/main...codex/student-marketplace?expand=1) with the title/body above. No local credential extraction or permission bypass is part of this plan.
