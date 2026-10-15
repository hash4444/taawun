# TAAWUN · تعاون

A UAE student-first employment marketplace for university students and fresh graduates aged 18+. Students find work around their studies; verified employers publish opportunities and manage hiring. English/Arabic, responsive mobile/desktop.

## Local setup

Use Node.js 24 LTS and npm. The canonical dependency lock is `package-lock.json`.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell: `Copy-Item .env.example .env.local`. Frontend: `http://127.0.0.1:8080`. Empty configuration displays a setup error and does not contact a cloud database. Authentication/data screens require a local Supabase stack.

For full services, install Docker and Supabase CLI using the [official local development guide](https://supabase.com/docs/guides/local-development). Discover commands with `supabase --help`. Start an **unlinked local stack**, apply repository migrations using its supported local workflow, and obtain URL/public client key using `supabase status`. Put only public values in `.env.local`; allow your localhost Auth redirect origin. Do not substitute service-role credentials or link/apply to a cloud database without authorization.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

`npm run check` runs frontend and Edge type checks, lint, Vitest, Deno handler tests, build and browser tests. Vitest includes PGlite PostgreSQL migration/RLS execution with substitute Auth/Storage schemas. Playwright drives the real SPA against isolated HTTP fixtures on desktop/mobile Chromium. Neither proves a deployed Supabase integration works. See TEST_REPORT for executed results and remaining integration checks.

## Main flows

- Student: **Home → Explore → Applications → Profile**, including reusable academic details, eligibility declarations, optional CV/calendar and agent settings. Profile progress is resumable.
- Employer: registration → documents/final admin verification → AED/UAE job → shortlist/interview/offer → student acceptance → placement confirmation.
- Admin: `/admin` on the same origin, trusted database role required. Legacy verified records without reviewer evidence need an administrator to review them again.
- Availability: preferred work windows plus private manual/ICS busy periods; recurrence/exclusions/timezones supported. Calendar titles are discarded. Interviews/confirmed fixed work can be downloaded explicitly to a personal calendar.
- Agent: explainable deterministic matching and truthful drafts; approval default. Paid AI, automatic/external submissions and cron jobs remain disabled until separately authorized/configured.

Google/Microsoft sign-in and direct calendar connections need provider credentials, registered callbacks and consent testing. ICS files exported from university/Google/Outlook calendars work without granting provider access. Email/SMS delivery has not been verified.

`VITE_ENABLE_LEGACY_MODULES=false` isolates historical wallets/payments/payouts, attendance, event/freelance storefront and advanced intelligence. Source is preserved; enabling a route does not make it launch-ready. Payroll, fees, contracts and future university/corporate programmes are outside this release; no Dubai Investments partnership is asserted.

## Documentation

- [Initial technical audit](docs/TECHNICAL_AUDIT.md)
- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database security](docs/DATABASE_SECURITY.md)
- [Executed test results](docs/TEST_REPORT.md)
- [Deployment/rollback](docs/DEPLOYMENT_GUIDE.md)
- [Launch checklist](docs/LAUNCH_CHECKLIST.md)
- [Staging readiness](docs/STAGING_READINESS_REPORT.md)
- [Supabase target reconciliation](docs/SUPABASE_PROJECT_RECONCILIATION.md)
- [Restored project inventory](docs/RESTORED_PROJECT_INVENTORY.md)
- [Hosted schema and adoption review](docs/HOSTED_SCHEMA_REVIEW.md)
- [Hosted storage and operations review](docs/HOSTED_OPERATIONS_REVIEW.md)
- [Migration impact](docs/MIGRATION_IMPACT_REPORT.md)
- [Real integration plan](docs/STAGING_INTEGRATION_PLAN.md)
- [Prepared draft PR and permission diagnosis](docs/PULL_REQUEST.md)

No production database or deployment has been changed. Controlled launch requires a complete Supabase staging rehearsal and business/legal/privacy/operational approvals.
