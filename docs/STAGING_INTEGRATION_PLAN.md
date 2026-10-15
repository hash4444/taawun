# Staging integration validation plan

Status: prepared locally on 2026-10-15. No Supabase integration run, account creation, migration, provider connection, test email, cloud record read, storage operation or deployment was performed by this plan or its offline validation. Local automated checks and a passing clean-clone CI build do not prove hosted behavior.

## 1. Data safety and approval gates

The owner selected `xhogffnpjaoxkgoiwcty` as a **provisional reconciliation target**, not as an empty test environment. It is inactive and its backing data is unknown. The original `fvnemfbqpmweqzhzuflu` may also contain important data. Do not reactivate, migrate, reset, seed, delete, deploy to or overwrite either project under this plan. The supplied harness permanently refuses the original reference. It has no default for the provisional candidate and must never execute against it in its current unknown/inactive state. A future safety decision may authorize the candidate only if the owner establishes it is empty/test-only and recoverable, then separately approves the exact read-only scope.

Before any staging execution:

1. Finish [project reconciliation](SUPABASE_PROJECT_RECONCILIATION.md): owner confirms project ownership, recovery options, backups/exports, historical Auth users/roles, database migration history, Storage objects, Functions and configuration. An empty branch list or failed table connection is not evidence of an empty database. Record unknowns instead of filling them in by assumption.
2. Obtain separate approval for recovery/reactivation if necessary. Identify the backup coverage for database, Auth and Storage, record the restore point and demonstrate recovery in an approved disposable environment. Database backups alone must not be assumed to preserve file bytes or third-party configuration. No reset or migration of a historical project is a discovery method.
3. Use an explicitly approved, isolated **sterile staging target** with no real users, vacancies, CVs, IDs or calendar data. The provisional candidate qualifies only after evidence establishes it is empty/test-only and recoverable and the owner separately approves staging use; otherwise use a separately approved sanitized copy. If copying historical data, obtain approval and sanitize it before test access. A copied project containing personal data is not sterile. Owner records the exact staging reference, region, frontend origin, data-safety decision and allowed operations. Creating a project or incurring any cost needs its own approval.
4. Approve a staging-only migration/deployment rehearsal as a distinct step. Review the checked-in migration sequence, schema/grants diff and rollback/recovery plan. Rehearse additive migrations on the approved staging copy; run security/performance advisors and review findings. Do not run `db reset`, `db push`, `apply_migration`, reactivation or function deployment merely because this document exists.
5. Approve read-only preflight separately from **account/fixture creation and workflow mutations**. The latter includes emails, synthetic KYC uploads, approval decisions, applications, notifications and quota consumption. Environment guard strings record a decision; they never supply human authorization.

Current outcome is **NOT RUN / BLOCKED ON DATA SAFETY AND STAGING APPROVAL**. Backup inventory is unresolved: the local CLI read attempt requires normal authentication; no CLI login was started. The owner can separately approve a backups-only authenticated inspection or inspect recovery details in the Dashboard, while keeping the candidate inactive. Review historical deployed functions and dependencies before any resume. See [staging readiness](STAGING_READINESS_REPORT.md) and [deployment guide](DEPLOYMENT_GUIDE.md). No provider, cron, paid AI or public launch is authorized by this plan.

## 2. Offline preparation and harness boundaries

Run these commands from the repository root with Node >=22.12. They need no credentials and make no network calls:

```powershell
node scripts/staging/prepare.mjs
node scripts/staging/preflight.mjs --plan
npx vitest run src/test/staging-preflight.test.ts
```

`prepare.mjs` generates a unique `taawun-staging-*` run under ignored `work/staging/<runId>/`, containing `manifest.json`, `fixtures.json` and a real `academic-timetable.ics`. It refuses to overwrite an existing run. The fixtures are templates: actor IDs are unbound, all email addresses end in `example.invalid`, consent is initially absent and the manifest target is null. No passwords, JWTs, admin keys or real documents are generated. Job enums match the checked-in schema (`employment_type=temporary`, `job_type=internship/shift`); currency is AED. Dates start about 14 days ahead, so regenerate stale runs instead of editing evidence. These files are not an automatic seed program.

The fixture ICS contains synthetic title/note sentinels. Passing it through the existing calendar parser must produce only busy intervals and opaque event identifiers; the sentinel title/note must never appear in a browser request, database event or employer response. Each run needs fresh accounts and job copies so capacity, rejection, expiry and quota scenarios do not interfere.

`preflight.mjs` defaults to plan-only, including when environment variables are present. The only network mode is explicit `--execute`; do not run it until all relevant gates above are satisfied. It requires **every** variable below, has no default remote target, rejects the protected original reference and privileged keys, checks HTTPS origins/project-reference agreement, disables redirects and uses 10 second request timeouts. The exported runner applies the same guards before requests. A prepared manifest and unused report path must exist before CLI execution.

| Variable | Required meaning |
| --- | --- |
| `TAAWUN_STAGING_RUN_ID` | Fresh prepared run ID; lowercase safe characters only |
| `TAAWUN_STAGING_PROJECT_REF` | Exact approved sterile staging reference; provisional candidate is not authorized by its selection alone; never infer from an old `.env` |
| `TAAWUN_STAGING_SUPABASE_URL` | Exactly `https://<approvedRef>.supabase.co`; custom domains require separate review |
| `TAAWUN_STAGING_APP_ORIGIN` | Exact approved HTTPS frontend origin, with no path, credentials or query |
| `TAAWUN_STAGING_PUBLISHABLE_KEY` | Staging publishable key, or verified matching legacy anon key; never secret/service-role |
| `TAAWUN_STAGING_DATA_SAFETY` | Exactly `CONFIRMED_STERILE_STAGING`, after the real decision |
| `TAAWUN_STAGING_DATA_SAFETY_REFERENCE` | Non-secret approval/ticket reference documenting isolation and backup/recovery decisions |
| `TAAWUN_STAGING_APPROVAL_REFERENCE` | Non-secret owner approval reference for this exact read-only scope |
| `TAAWUN_STAGING_APPROVAL` | Exactly `READ_ONLY_PREFLIGHT:<approvedRef>:<runId>` |

After separate permission, an operator may run `node scripts/staging/preflight.mjs --execute`. This performs **seven GET requests only**: frontend root, `/worker/explore`, an intentionally missing asset, public Auth settings, and three PostgREST queries with `limit=0`. It does not sign in, request real records, create accounts, seed data, call mutation RPCs, upload/delete files, invoke Functions, migrate, deploy or clean up. `/worker/explore` is the actual discovery route; `/worker/jobs` is a compatibility redirect. The report contains check results/statuses, target reference and non-secret approval references, without keys, response payloads or raw network errors. Do not put secrets into reference fields.

A passing preflight establishes reachability/basic host policy only. It cannot establish RLS correctness, emails, provider setup, deployed migration equivalence, session behavior or launch readiness. An unexpected grant failure is a finding to investigate, not a reason to weaken RLS. The integration matrix below is a controlled operator checklist, **not implemented as remote automation**.

## 3. Fresh actor and fixture protocol

| Actor | Fresh setup and purpose |
| --- | --- |
| `studentA` | Worker role through normal signup, student profile and private calendar/CV; primary positive workflows |
| `studentB` | Independent worker role/session/inbox; cross-account attacks, missing consent and second capacity claimant |
| `employerA` | Normal business signup, own synthetic company and jobs; initially unverified, then trusted review |
| `employerB` | Independent business/company/jobs; ownership attacks and applicant isolation |
| `trustedAdmin` | Normal fresh account first; trusted operator grants admin to its exact verified Auth UUID only after approval; never metadata, public signup or UI self-promotion |

Use five operator-controlled inboxes and five isolated browser profiles/clients. Replace `.invalid` placeholders only after approval. Record each newly created Auth UUID and fixture job/CV/document/application IDs in a local allowlist manifest. In this schema the business row ID equals its Auth UUID; verify the actual row rather than inventing a UUID. Never substitute an existing user's identity, admin account, credentials or documents. A publishable key identifies the application; API tests must use each actor's own access token to exercise real RLS. A service key bypasses that boundary and is unsuitable for proving actor access. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

Use synthetic watermarked documents saying `STAGING TEST — NOT A REAL ID/LICENSE`, no genuine government IDs. Publish only marked synthetic jobs in the isolated staging app. Keep matching consent off initially, and do not directly seed approved verification flags, AI matches/drafts, quotas or audit records. Create those through the intended trusted workflows. Never share session tokens between actor clients.

For every negative API case, check both response and unchanged state with the authorized owner. RLS may return `200 []`, or an update/delete may affect zero rows, rather than returning an HTTP error. Missing table/column grants generally return 401/403; uniqueness can return 409; business-rule RPC failures can return 400/409 depending on the handler. Record sanitized error code and row effects instead of requiring one universal status. The preflight specifically expects table-level anonymous denial on `student_profiles`/`user_roles`, matching checked-in revoked grants.

## 4. Auth, onboarding and trusted verification matrix

| ID | Surface / action | Expected assertion and evidence |
| --- | --- | --- |
| AUTH-01 | Signup with email/password for all actors; confirmation enabled | Controlled inbox receives one appropriate confirmation; unconfirmed signin is blocked; confirmed signin loads own profile and trusted lowercase `worker`/`business` role. Record delivery and browser outcomes without storing message tokens. |
| AUTH-02 | studentB sends metadata claiming admin/business/verified; direct PostgREST writes to `user_roles`, `profiles.role`, initialization/reviewer fields | No privilege gain; trusted DB role remains worker. Admin UI/Functions/RPCs deny studentB. Zero protected state changes, including after token refresh/relogin. |
| AUTH-03 | First account setup via `complete_account_setup(account_role,full_name,phone)`; retry and attempted later role switch | First permitted public role initializes correct audience row; admin value denied. Established profile/jobs/applications/CVs cannot be switched through client metadata/RPC retries. Actual error stays visible and retry does not silently enter another audience. |
| AUTH-04 | Refresh/deep link, expired session, failed profile request, signout and account switch | No prior actor's query cache/profile/calendar/CV flashes; errors do not grant access. Own protected API fails without a usable session. Signout clears local data and revokes refresh capability. An already issued access JWT may remain valid until expiry; measure and document this rather than claiming immediate global JWT invalidation. |
| AUTH-05 | Password reset email, expired/reused link, change password, old/new password | Valid flow reaches `/auth/reset-password` on the exact staging origin; expired/reused callback has clear recovery; new password works. No credentials/code/verifier in error logs or evidence. |
| STUD-01 | Incomplete studentA profile, no 18+ consent, or eligibility unconfirmed; attempt direct `submit_application` | Missing declaration is blocked server-side, including REST/RPC bypass of the UI. Complete actual required academic/location fields and explicitly confirm 18+ and eligibility before retry. These are self-declarations, not DOB/ID/permit verification; no legal eligibility claim is inferred. |
| STUD-02 | Save academic profile and preferred job types; reload in EN/AR; withdraw matching consent | Real own data persists and CV prefill uses those fields. studentB/employers cannot overwrite it. Withdrawal removes the student from new candidate scans/outreach; application-related access follows its separate existing relationship. |
| KYB-01 | employerA publishes or runs candidate scan while unverified | Denied. Direct writes of `verification_status`, reviewer/time, or legacy bare verified flags cannot enable publication. |
| KYB-02 | Upload required own commercial registration/license/representative documents, call `request_verification()` | Missing/invalid required documents fail; valid submission becomes pending review through server flow. Other actors cannot replace/read/review files. No nonexistent verification-email success is claimed. |
| KYB-03 | trustedAdmin uses `review_verification_document`, then `review_verification` with final decision/notes | Document approval alone is insufficient. Final account approval validates required documents and stores trusted reviewer/time; only then can employerA publish. Rejection and reason are shown; durable notification/audit evidence exists. Student/employer calls are denied. |
| KYB-04 | Legacy records and existing admin grants | Separate read-only human audit/re-review after recovery approval. No blanket reset, self-approval or assumptions based on historical `verified` flags. This case never authorizes changing historical data during test setup. |

Supabase session behavior and short-lived JWT limits should be assessed against [user session documentation](https://supabase.com/docs/guides/auth/sessions). If immediate revocation of every sensitive operation is a launch requirement, explicitly decide/test the server session-validation policy; the current client signout alone is not evidence of it.

## 5. Discovery, application and employer ownership matrix

| ID | Surface / action | Expected assertion and evidence |
| --- | --- | --- |
| JOB-01 | Verified employerA creates flexible internship, compatible fixed shift and conflicting fixed shift from fixtures | AED/AE, schedule, salary/pay model, future deadline and capacity persist. Student discovery/filter/detail renders real public company fields. Unknown or invalid schedule/pay/time/capacity data is rejected; unverified employerB cannot bypass publication rules. |
| JOB-02 | Anonymous/student/employerB reads or updates employerA private company row/jobs | Open safe listings remain readable; private company/KYB fields remain hidden. `get_public_businesses(p_ids)` returns bounded verified safe fields only. Other employers cannot edit/delete/claim jobs or change poster/business ID. |
| APP-01 | studentA calls `submit_application(p_job_id,p_cover_letter,p_ai_draft_id)` for eligible flexible/compatible fixed jobs | Exactly one own application with server-controlled initial status; own history and employerA queue agree. Duplicate, closed, expired, full or ineligible submissions fail without duplicate notifications/audit entries. Direct insert/status/ownership tampering cannot bypass RPCs. |
| APP-02 | employerA advances independent applications using `update_application_status(p_application_id,p_status,p_interview_at,p_message)` | Allowed applied/shortlisted/interview/offered/accepted/placed/completed flows work with future interview time and actor ownership. Use separate fixtures for rejected/cancelled branches. Student accepts only own offer; employer cannot accept for them. Invalid jumps and employerB decisions fail. Audit actor/transition and recipient notifications are correct. |
| APP-03 | Two students accept offers concurrently for a one-slot job | At most one acceptance/placement consumes the slot; no overfill. Retried requests do not duplicate capacity, notifications or audit decisions. Record final rows/counters via authorized views, not only response order. |
| APP-04 | Calendar or consent/eligibility changes after apply and before accept | Acceptance reruns current hard gates; a new real fixed-shift conflict blocks acceptance. Check the explicit existing-offer deadline policy separately from first submission. Accepted material pay/schedule/location/requirement terms cannot later be changed under the student. |
| APP-05 | Close, reset-to-draft or delete a job with applications; view student history | Applicant history remains readable to that applicant and employer. Deletion/draft changes cannot erase it or evade active application protection. Non-applicant studentB cannot see closed private listing history. |
| APP-06 | Employer applicant/candidate profile and CV access | employerA reads relevant applicants only; employerB and unrelated students see no record/file. Pre-application consented candidate summaries expose only permitted profile fields, never private CV files or academic timetable. |

## 6. Private calendars, files and matching matrix

| ID | Surface / action | Expected assertion and evidence |
| --- | --- | --- |
| CAL-01 | studentA saves weekly windows/minimum shift/travel buffer, manual busy period; refresh | Actual saved preferences/events appear only to studentA. studentB/employers cannot enumerate/update/reassign them; private provider credentials are not exposed through public API. Client cannot forge connected/sync coverage state. |
| CAL-02 | Import generated ICS and actual synthetic exports from both Google and Outlook; inspect browser request | Valid RFC5545 import becomes busy intervals only through `replace_calendar_import(p_events)`. No title/description/attendee sent. Reimport atomically replaces own ICS source; malformed/over 2,000 event input fails without erasing existing import. Concurrent import cannot partially interleave. |
| CAL-03 | Confirm matching with fixture compatible/conflicting shift; boundary/overnight/DST tests | Class conflict, travel buffers, insufficient window union and minimum shift block fixed work. Adjacent windows/24:00 boundaries and repeated/nonexistent local times match the shared local tests and SQL behavior. Use explicitly dated synthetic DST events in a real IANA timezone; UAE itself has no DST. Empty/stale/beyond 120 day imported coverage never claims confirmed freedom. Flexible work displays schedule confirmation honestly. |
| CAL-04 | Matching with `share_with_employers=false`, then explicit true, then withdrawal | Employer fixed-shift fit stays unknown with generic confirmation text while private sharing is off; no timetable inference via specific conflict reasons. Explicit sharing permits bounded server fit evaluation only, never raw event lists/titles/tokens. Withdrawal takes effect in later scans and approval checks. |
| CAL-05 | `disconnect_calendar('ics')` and manual event deletion | Only caller's corresponding source is removed; other student's data and independent manual source remain. Connection/coverage updates are truthful. No direct Google/Microsoft connection is shown as live. |
| FILE-01 | Upload small synthetic PDF/DOCX CV into own `cv_files` path; preview/sign/download | Bucket stays private; public object URL is denied. Owner-bound normalized path and short-lived signed preview work; DOCX offers clear download fallback. Owner/studentB/employerA/employerB access matrix is enforced by actual Storage service, including guessed owner prefixes. |
| FILE-02 | CV create/update/delete and deliberate record-save failure | Local draft summary contains only entered facts and `is_ai_generated=false`; academic prefill is correct. Long CV exports multiple complete A4 pages. Failed record insert attempts file cleanup; cleanup failure is visible. Confirmed deletion removes own object then record; failure retains recoverable evidence. Use staging fixture IDs only. |
| FILE-03 | KYC object path/type/MIME/size/upsert and signed URLs | Correct bucket/owner rules enforced; cross-user path, disallowed type and oversized upload rejected. Reviewed/approved files cannot be silently self-replaced/deleted. Measure signed URL TTL/cache behavior rather than assuming immediate revocation after deletion/review. Do not log signed URLs. |

## 7. Edge Functions, approval and quota matrix

All Function calls below must use actual actor JWTs and the approved origin after a distinct staging Function deployment is approved. The function config's `verify_jwt=false` does not mean anonymous application access: handlers validate JWTs with Auth and check trusted DB roles. Test direct HTTP invocation in addition to UI routes; never use a service key as the end user.

| ID | Surface / action | Expected assertion and evidence |
| --- | --- | --- |
| EDGE-01 | Missing/expired/forged JWT, wrong role, unsupported method/action, malformed/oversized body; CORS allowed/disallowed origin |401/403/405/400/413 as appropriate, no mutation. Allowed origin receives expected CORS; disallowed browser origin cannot gain permission. CORS is not an authorization boundary: valid JWT/ownership checks still apply to non-browser requests. No stack/secret/provider body leaks. |
| HUNT-01 | `ai-job-hunter?action=run_user` for studentA with valid profile, latest CV and consent | Bounded deterministic recommendations/drafts persisted for that student. Scoring cannot override pay/location/skills/experience/eligibility/calendar hard exclusions. Incomplete profile, withdrawn matching consent, paused setting or stale coverage never produces an eligible automatic submission. Response `applied=0`; no external applications. |
| HUNT-02 | `ai-job-hunter?action=apply_draft` with an own draft, then another actor's draft | Own explicit approval calls transactional `submit_application`; result and draft/match status reflect one real submission with `is_auto_applied=false`. Foreign, submitted, outdated, below-threshold, excluded or now-conflicting drafts fail. Cover-letter edits are owner-only; user/job/score/submitted state cannot be forged by client writes. |
| HUNT-03 | Settings changed after drafting: paused, recommendations-only, consent withdrawn, lower daily allowance, new excluded company/location/pay/skill requirements | Approval rechecks current settings and hard gates at submission. With allowance 1, first eligible prepared application succeeds and second different job fails. Concurrent requests cannot exceed limit. Setting AUTO never enables an unattended application in this launch. |
| CAND-01 | `candidate-hunter?action=run_business`, then explicit `send_draft` | Only trusted reviewed employer sees its permitted consented candidates and own drafts. In-app invitation is deliberate, owner-bound and idempotent. StudentB/other employer cannot read/send the draft; pause/withdrawal/current eligibility are rechecked. No email delivery claim or raw calendar details. |
| QUOTA-01 | Exhaust scan budgets last, using independent marked cases | Checked-in durable cap is 5 student scans and 5 employer scans per account/day; sixth is 429 and does not run. Test concurrent calls and Dubai day boundary without editing production clocks/counters. Client cannot set another user, counter, feature cap or service-only budget. |
| QUOTA-02 | Chat with `AI_PROVIDER_ENABLED=false`; unauthorized cron `run_all` | Authenticated chat returns setup/disabled feedback (503) without provider calls or spending. Cron remains disabled and requires separate secret plus enable flag; missing/wrong secret denied. Do not turn on a paid provider/cron to make this case pass. |

Paid chat and direct-provider integration tests remain deferred. If separately approved later, budget tests must include the checked-in 20 chat/day/account,5/minute/account and 100/day global limits, streaming failure/timeout, sanitized error handling and exact spend controls; do not exhaust a shared real-user allowance. Counter effects on failed/disabled requests must be observed/documented rather than assumed. Scan/application/outreach quotas are separate counters.

## 8. Manual email, OAuth and provider acceptance

| Capability | Required controlled check | Current truthful state |
| --- | --- | --- |
| Confirmation/reset email | Owner configures a permitted sender/test inbox service; verify delivered sender/domain, spam handling, expiry/single use, correct HTTPS origin and retry/rate-limit feedback. Test confirmation before normal signin and recovery after logout. Save timestamps/outcome only. | No live email delivery has been validated. SMTP/provider activation is separate; no real-user email blast. |
| Google/Microsoft login | Configure consent app and exact authorized Supabase callback plus staging app return URLs; enable one frontend flag at a time. Test PKCE success, cancel, provider error, reused code, missing verifier, callback refresh and worker/business first setup. Reject external or wrong-audience next paths. Review account linking/email collision behavior explicitly. | Buttons stay unavailable until provider configuration exists. OAuth login is separate from calendar permission. |
| Google/Outlook ICS | Export a synthetic timetable in each provider UI; import locally/staging, verify timezone, recurrence, cancellation/all-day behavior, privacy sentinels and fresh coverage. | Real ICS parser/import path exists; provider-export interoperability still needs human validation. |
| Direct calendar connection | Future approved backend wrapper must provide OAuth state/PKCE, least-scope grant, encrypted server token lifecycle, refresh/revoke, own-account association, bounded horizon and error/pagination handling. Test expired401/revoked403/429/partial results and no falsely free calendar. | Read-only adapters are prepared and HTTP-mocked. No OAuth endpoint, saved token or active direct connection exists; do not label them connected. |
| Prepared scopes | Google `https://www.googleapis.com/auth/calendar.freebusy`; Microsoft delegated `Calendars.ReadBasic` for default calendarView. Review tenant consent/scope requirements before future activation, and never silently upgrade to broad permissions. | Adapters emit private busy intervals only, with 120 day/size/page/time bounds; no titles/tokens. |
| Phone verification | Configure delivery/abuse controls and controlled test number only after separate approval; verify failure/rate limiting and actual factor/session assurance. | Frontend feature flag defaults false. No SMS delivery or additional-factor guarantee is asserted. |

Provider scope/API contracts should be rechecked before activation against [Google FreeBusy](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query) and [Microsoft calendarView](https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0). This plan prepares checks; it does not request or persist provider credentials.

## 9. Production-like host and operational gaps

Review the actual staging response, not just checked-in files. `public/_headers` and `_redirects` are examples whose support depends on the eventual host. No staging host or public deployment was activated.

| Area | Current source / gap | Minimal validation or proposed change after host approval |
| --- | --- | --- |
| HTTPS | CSP upgrades insecure requests, but no certificate/redirect/host has been proven | Validate valid certificate and HTTP-to-HTTPS redirect at the chosen host, no mixed content or alternate-origin session leakage; decide HSTS after HTTPS/subdomain readiness. `_headers` currently has no HSTS directive. |
| SPA | `_redirects` sends `/*` to index; actual host may also rewrite missing assets | Deep-link `/worker/explore`, login callback/reset and refresh must work. Missing hashed JS must return404, not HTML200. Add host-specific asset exclusion only when tested on that host. Preflight intentionally fails an HTML fallback. |
| Cache/rollback | Hashed assets have immutable 1 year cache; HTML has no explicit policy in the example | Add/test HTML revalidation/no-store policy, deploy two versions to approved staging, refresh an old tab and rehearse rollback. No stale shell or schema mismatch should silently display another account's data. |
| Headers/CSP | CSP/nosniff/frame/referrer/permissions examples exist; generic Supabase hostname allowlist | Inspect deployed headers and browser violations for auth, signed CV preview, fonts, images and calendar downloads in EN/AR. Narrow origins to actual approved dependencies; custom Supabase domains require explicit review. Do not fix violations by globally disabling CSP. |
| Secrets/build | Browser receives only publishable key and flags; server credentials belong in staging Function secrets | Review built assets/source maps for service/provider keys, local files and unintended debug content. Confirm wrong/missing env shows setup state. Keep paid provider and cron flags false. |
| Errors/monitoring | UI error states and Function logs exist; no configured external error-monitoring service or alert owner is established | First use approved host/Supabase logs with restricted access, a short retention policy and an accountable operator. Add sanitized request/run correlation and alert thresholds if needed; never log auth headers, OAuth codes, signed URLs, CV bodies, calendar content or KYC images. No paid monitoring service activation is part of this plan. |
| Operational recovery | Unknown historical backups and no demonstrated cloud restore | Record restore rehearsal, migration rollback decision, file recovery, account/role review and incident owner before launch. A SQL test suite cannot satisfy this gate. |

Current public Supabase documentation was checked on 2026-10-15. Its [changelog](https://supabase.com/changelog) announces a forthcoming HTTP API TLS cipher change; use supported modern browsers/Node and verify actual HTTPS from the supported target devices before launch. No SDK upgrade or cloud setting change is made by this plan.

## 10. Evidence, cleanup and acceptance

Record each case as `NOT RUN`, `PASS`, `FAIL` or `BLOCKED`, with commit SHA, exact approved project/frontend, migration history, actor aliases, sanitized response/error codes, expected versus actual row/file effects and date/operator. Keep secrets and personal content out of reports/screenshots/HAR files. Store credential material only in the approved secret/session store; ignored `work/` is convenient scratch space, not a secret vault. Do not attach raw auth traffic or signed links to a PR.

A run is accepted only when the positive and cross-account negative cases pass through the real hosted Auth, PostgREST, Storage and Functions services; manual emails/OAuth are evidenced or deliberately unavailable; default paid/automatic paths remain off; host/cache/error handling is validated; advisors and backup/recovery/privacy-retention/legal launch decisions have owners. Unknowns remain explicit launch blockers. Capture failed assertions before any repair and rerun the affected boundary after repair.

Cleanup is a **separate approved operation**: review the exact run allowlist of newly created UUIDs/object paths, prove each belongs to this synthetic run, sign out/revoke sessions, then delete only the approved fixtures through a reviewed dependency-aware procedure. Do not run broad name-prefix deletes, truncate tables, reset quotas, delete existing accounts, or assume an old manifest is safe against a new target. Preserve redacted evidence and note any intentionally retained audit records. No cleanup script is supplied, and no deletion has been run.
