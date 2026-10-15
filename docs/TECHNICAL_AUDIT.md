# TAAWUN technical audit

Audit date: 2026-10-15. Baseline: `7bcc61a8db4174867ea99feeecefc0d3bb2080dd` (`origin/main`). Development branch: `codex/student-marketplace`.

This is an audit of the checked-in application, all five existing migrations, three Edge Functions, configuration, and tests. Production deployment, database state, secrets, OAuth registrations, and existing users have **not** been inspected or changed. Historical migration defects are addressed by additive development migrations, never by silently rewriting production history.

## Baseline executed checks

| Check | Observed result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Completed; 607 locked packages installed |
| `npx tsc --noEmit -p tsconfig.app.json` | Failed: missing TranslationKey import; chat session JSON decoding; BusinessWorkers relationship typing |
| `npm run lint` | Passed |
| `npm test` | Passed one placeholder `expect(true).toBe(true)` test; no behavioral coverage |
| `npm run build` | Passed, despite TypeScript errors (Vite transpiles); main JS about 1.13 MB, logo about 983 KB |
| `npx playwright test --list` | Failed: undeclared `lovable-agent-playwright-config` dependency |

## Architecture and data inventory

- React 18 / TypeScript / Vite SPA, React Router, TanStack Query, Tailwind and shadcn/Radix UI. Routes are eagerly imported in `src/App.tsx`. Contexts manage theme/language and authentication. Hooks directly access Supabase under RLS.
- Separate worker and business mobile/desktop shells; admin routing selected by hostname/preview query. Mobile and desktop student navigation disagree (five versus ten items). Arabic RTL exists but much UI is English or binary Arabic/English despite five advertised languages.
- Supabase Auth supports password and Google entry points. Database includes profiles, user_roles, workers, businesses, jobs, applications, attendance, ratings, KYC documents, bank accounts, wallet ledger, disputes, admin actions, CVs, chat sessions, worker and employer agent settings/matches/drafts/logs.
- The five migrations date from April to June 2026. All have been reviewed, including storage policies and signup trigger. Three functions: `ai-job-hunter`, `candidate-hunter`, `chat`. No checked-in independent Node API, payment processor, production CI, scheduled-job deployment, or complete environment/deployment instructions.
- Client configuration: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Other screens reference VITE_API_URL and missing function endpoints. Provider secrets required by existing functions include LOVABLE_API_KEY, ANTHROPIC_API_KEY, Supabase service credentials and candidate CRON_SECRET. No secret values are reproduced in this audit.

## Prioritized defects and business impact

| Priority | Finding | Impact / repair |
| --- | --- | --- |
| P0 | AuthContext derives admin access from user-editable user_metadata and accepts privileged aliases | Read trusted database roles; fail closed; enforce every operation in database/functions |
| P0 | Owner UPDATE policies allow changing profile role and worker/business verification fields | Prevent self-verification and privilege edits using column grants / guard triggers and trusted admin checks |
| P0 | Application owner can choose employer-controlled decisions; ownership/status transitions insufficient | Transactional server-owned state machine with role and job ownership checks |
| P0 | ai-job-hunter run_all branches before authentication while gateway JWT verification is disabled | Require dedicated cron secret, validate user JWTs, deny unknown actions, bound provider use |
| P1 | Public profile email/phone and public CV storage can expose student data | Private profile/CV policies, explicit applicant-scoped access and signed URLs |
| P1 | KYC review fields and attendance approval are protected only by broad owner policies | Separate applicant submission from administrative review; restrict attendance approvals |
| P1 | isVerified=false and verificationStatus=not_started are hard-coded; no DB profile hydration | Fetch actual profile and role-specific records and expose loading/error/retry states |
| P1 | Uppercase auth roles versus lowercase enums/checks in Index, KYC, jobs and settings | One canonical lowercase role contract; reject untrusted role escalation |
| P1 | OAuth callback requires legacy ?token and its token setter is a no-op | Support Supabase PKCE/implicit callbacks and recovery; safe internal redirect allowlist |
| P1 | /worker/jobs/:jobId and /worker/jobs/:category collide; worker/business routes lack shared guards | Unambiguous discovery/detail routes, role guards and lazy route loading |
| P1 | Student profile, university, degree, 18+ eligibility/consent and schedule preferences absent | Add private student onboarding and editable resumable profile |
| P1 | Paid chat lacks effective authentication/rate bound; AI drafts/submissions lack full deterministic limits | Authenticate, quota, gate costs, enforce hard requirements before AI and before submission |
| P1 | Candidate Hunter marks drafts sent without actual delivery | Use real in-app notifications or explicitly keep as drafts; never claim external delivery |
| P1 | Worker AI hooks embed jobs relationships absent in committed schema and swallow errors | Explicit joins/FKs with non-destructive legacy checks; surface errors |
| P1 | No academic calendar/availability engine, privacy model or timetable-aware checks | Private manual/ICS availability and tested interval/timezone matching; provider setup gated |
| P2 | Wallet reads ledger but payout buttons lack handlers; no complete charge/settlement system | Defer financial processing pending approved operating model; hide unavailable actions |
| P2 | QRScanner opens camera but never decodes; JSON lacks expiry/signature verification | Isolate attendance until robust scanner and server authorization verified |
| P2 | Events, notifications, company info and recruitment analytics use fixtures/hard-coded values | Replace core surfaces with real records; defer fixture-only modules |
| P2 | CareerAssistant points to absent external API; cv-ai-summary, career-intelligence, business-assistant and send-verification-email absent | Route supported features to verified backend contracts; disable incomplete extras |
| P2 | CV upload URL is not persisted by useSaveCV and uploaded document is not parsed | Preserve private file linkage and distinguish upload from structured CV |
| P2 | Legacy admin.skillanything.ai hostname, broad preview detection and logging | Configurable same-origin admin routing with server-side authorization |
| P2 | Signup drops phone; forgot-password inert; notification toggles and profile edit buttons inert | Implement real actions or explicitly disable unavailable actions |
| P2 | SAR/Riyadh defaults and unrestricted older positioning conflict with UAE student-first brief | AED/UAE defaults; adult student/graduate copy; no unconfirmed partnerships |
| P2 | Placeholder README, no useful behavioral tests, broken Playwright config | Reproducible scripts, regression suites, CI, honest integration blockers |

## Feature decisions

| Classification | Modules |
| --- | --- |
| KEEP | Authentication, verification, jobs, applications, basic employer review, CV, EN/AR, responsive components |
| REPAIR | Trusted roles, verification hydration, permissions, hiring transitions, AI authorization, discovery routes, profile saves |
| SIMPLIFY | Four student destinations; concise employer job/application flow; AI settings within Profile; real basic analytics |
| DEFER / isolate | Payroll, payouts, fees, advanced intelligence, freelance storefront, event directory, QR attendance until verified, external auto-apply, corporate/university dashboards |
| REMOVE | Only proven dead configuration/dependencies and duplicate routing; preserve functioning legacy modules behind route isolation |

## Privacy, deployment and operational gates

- New schemas must be additive, RLS-protected, owner-scoped and migrations reviewed against existing records. No replacement production database or live mutation is authorized.
- Personal calendar event content and OAuth credentials must remain private. Employers receive only explicitly shared availability summaries. Provider calendars require separately configured OAuth credentials and consent.
- Initial cohort is 18+ university students and fresh graduates. UAE work eligibility and business licensing must be confirmed professionally. Eligibility declaration is not a legal work-permit decision.
- Payment processing, recruitment fees, employment contracts and regulated placement services remain disabled without an approved operating model. Proposed university/corporate partnerships are unconfirmed.
- Production launch requires verified staging migrations/RLS tests, provider configuration, backup/rollback rehearsal, business/legal/privacy/operational approval. Passing mocked browser tests cannot establish these conditions.

## Development follow-through

This initial audit precedes major implementation. Subsequent implementation, executed results and unresolved blockers are tracked in TEST_REPORT, DATABASE_SECURITY, DEPLOYMENT_GUIDE and LAUNCH_CHECKLIST. Audit findings above describe the baseline; they are not claims that fixes have already passed.
