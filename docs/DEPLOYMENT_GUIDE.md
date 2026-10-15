# Deployment and rollback guide

This is a preparation guide, not a deployment record. The user chose **continue locally**. No cloud project was reactivated, migrated or deployed.

## Environment gate

The original checkout referenced `fvnemfbqpmweqzhzuflu`. Read-only account discovery showed an inactive Taawun project `xhogffnpjaoxkgoiwcty`; their identity/contents were not assumed equivalent. The local CLI project ID is now `taawun-local`. Cloud target selection and activation require separate user authorization. Keep local `.env.local` blank until real local public credentials exist; ignored environment files must never enter Git.

Use Node24 LTS, pinned npm lockfile and pinned Deno. `npm ci` reproduces dependencies. Only URL/public Supabase key and public provider/legacy UI flags belong in VITE variables. Backend service-role, provider and cron credentials belong only in a secret manager. `.env.example` and `supabase/.env.example` contain no real credentials.

## Before authorized staging

1. Review the complete PR and additive migration against a schema-only snapshot. Identify legacy orphan relationships, historical admin grants and old verified accounts needing re-review. Take a backup; record migration history and row counts. Never replace or reset an existing cloud database.
2. Run `npm run check`, the Edge checks/tests, and `npm audit`. In an unlinked local Supabase/Docker stack, replay all migrations and run actual Auth/PostgREST/Storage negative-access tests. PGlite is an additional regression layer, not that stack.
3. After explicit authorization, apply migrations to the confirmed staging project using the supported CLI/MCP workflow; inspect grants/RLS and run advisors. Preserve old records and audit any conflicts rather than deleting them to satisfy constraints.
4. Configure Auth site/redirect allowlists, email confirmation/password recovery/SMTP and the chosen Google/Azure sign-in providers. Test both public account intents and spoofed admin metadata. Create initial admin privileges through a trusted operator, never signup metadata.
5. Deploy functions and frontend only to authorized staging. Set APP_ORIGINS exactly to its HTTPS origin. Keep AI_PROVIDER_ENABLED=false and CRON_ENABLED=false; do not add paid-provider keys or schedules by default. Function gateway JWT checks are intentionally complemented by JWT/role or cron-secret checks inside the handlers.

## Calendar setup

Manual and ICS support need no provider credentials. Google free/busy and Microsoft Calendar adapters are prepared and tested with mock HTTP. Direct connections require registered OAuth applications, exact callback allowlists, owner-bound one-time state/PKCE, encrypted server token custody, refresh/revoke/disconnect handling and consent testing. Do not put calendar refresh tokens in browser storage. Default scopes are read-only; calendar writes need separate consent.

Primary provider references: [Google freeBusy query/scopes](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query), [Microsoft calendarView/delegated permissions](https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0). Do not enable a direct-connect UI until its whole deployed OAuth/sync path is verified. File imports are snapshots and need refreshing after timetable changes.

## Frontend hosting

Build with `npm run build`; serve `dist/` as a SPA with history fallback. `public/_redirects` and `_headers` are Netlify/Cloudflare-style examples. Other hosts need equivalent routing/security headers configured explicitly; these files do not configure every host. Verify CSP, signed document previews, deep links and caches in staging. Static asset hashes may be cached immutably; HTML should refresh for new releases. No hosting account or deployment was created.

## Controlled launch authorization

Obtain business/legal/privacy/operational approval and complete LAUNCH_CHECKLIST. Verify adult/eligibility handling, employer review staffing, user support, data retention/deletion, incidents and backup ownership. Confirm platform/agency licensing and work-permit responsibilities professionally. Do not activate payroll/fees/contracts/regulated placements or represent a corporate partnership without approval.

## Rollback rehearsal

Record release commit, frontend artifact and function versions before rollout. If application behavior fails, stop new publications/submissions via controlled maintenance access, disable cron/paid providers and roll back the frontend/functions to a reviewed compatible version. **Do not restore a historically insecure authorization policy merely to make an old UI work.** Prefer a forward corrective migration; restore database backup only under a separately approved recovery procedure with an explicit data-loss assessment. Additive schema should remain until dependencies and preserved data are reviewed. Rehearse this in staging and record times/results before production approval.
