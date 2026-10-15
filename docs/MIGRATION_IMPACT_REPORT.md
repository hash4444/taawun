# Migration impact report — staging preparation

Prepared 2026-10-15 from local revision `96af52b1ada75fa1ff97dc404071f1fc52bcfcb7`. This report is a review artifact, not permission to activate a project, apply SQL, deploy functions, reset a database or read application records.

## Scope and target identity

- The owner provisionally selected `xhogffnpjaoxkgoiwcty` for staging only. Both this project and the original `fvnemfbqpmweqzhzuflu` may contain important data. The original reference is completely out of scope for further inspection or changes.
- Root-session metadata inspection reported the provisional project as **INACTIVE**, region `ap-south-1`, PostgreSQL `17.6.1.141`, created 2026-07-13. A table-list request timed out; a branch-list request returned an empty list. Neither result establishes that the database is empty or matches this repository.
- No hosted schema, migration history, bucket configuration, policy, grant, role assignment, application record or data count has been established by this report. No cloud SQL was executed. The owner's latest instruction authorizes non-destructive candidate schema/catalog, backup-metadata and aggregate data inventory; inactive-project connectivity currently blocks database inspection. Activation and mutations require separate explicit approval. Actual deployed function source was retrieved read-only as documented below.
- `supabase/config.toml` uses the local ID `taawun-local`. That setting is not evidence of a cloud link or a safe destination. Database name `postgres`, project display name and an empty branch list do not prove target identity.

**Decision:** do not activate or apply the migration to the provisional target yet. Continue the authorized non-destructive investigation where access is available, confirm identity and intended use, inspect backup metadata, obtain a schema-only snapshot and reconcile migration history and aggregate data. Preserve both projects. Unnecessary record-level personal data and data exports are outside this report's work.

## Evidence and its limits

All six files under `supabase/migrations/` were inspected. An empty, in-memory PGlite instance replayed the five historical files, captured PostgreSQL catalogs, applied the sixth file, and captured catalogs again. The scratch program and JSON catalogs are ignored local files under `work/migration-catalog*`; they are not deployment artifacts. Only local schema catalogs were queried for the migration replay; no hosted database rows or application-table records were inspected. Read-only deployed function retrieval was subsequently authorized and completed separately.

The local engine was PostgreSQL 18.6 / PGlite 0.5.10, with substitute Auth/Storage schemas and fixture grants. The provisional hosted engine is reported as PostgreSQL 17. Catalog details, default privileges, extensions, service behavior and lock characteristics can differ. In particular, constraint counts across engine versions should not be compared mechanically.

| Repository-derived catalog | After historical files 1–5 | After all six |
| --- | ---: | ---: |
| Project tables | 24 public | 30 public + 2 private |
| Project table columns | 250 | 327 |
| Public/private functions | 3 | 27 |
| User triggers, including the Auth signup trigger | 19 | 23 |
| Project indexes | 37 | 50 |
| Enum types | 15 | 15; four labels added |
| Public/Storage policies | 85 | 69 |

These totals describe the repository replay, **not the hosted project**. All 30 resulting public tables have RLS enabled; neither private table has RLS. Private-table protection instead depends on schema isolation and explicit ACLs. No project table uses `FORCE ROW LEVEL SECURITY`; privileged function owners and the service role remain trusted boundaries.

Existing regression evidence is documented in [TEST_REPORT.md](TEST_REPORT.md): 130 Vitest tests, seven mocked Deno handler tests and 24 browser tests passed locally. The database file currently contains 18 PostgreSQL regression cases, using substitute Auth/Storage schemas. Root also verified successful clean-clone CI for revision `96af52b`, run `38731841976`. None of these results establishes the hosted target's schema or data compatibility.

## Deployed legacy Edge Functions — read-only candidate inspection

The owner subsequently authorized non-destructive investigation of the provisional candidate. On 2026-10-15, `get_edge_function` retrieved only `ai-job-hunter` and `candidate-hunter` from `xhogffnpjaoxkgoiwcty`. These are management-plane source reads, not endpoint invocations. No function request, provider call, database query, secret-value read or cloud change was performed. No original-project request was made.

Both returned **version 1, status ACTIVE, verify_jwt=false**, although the project itself is INACTIVE. Creation/update timestamps were `1783942827823` and `1783942833579`, respectively. The root's function listing contained no chat function. An empty aggregate log result for the last 24 hours does not establish that these functions never ran or that the project lacks users, businesses or records.

### Source identity

Hashes below cover the returned `index.ts` text encoded as UTF-8 with LF line endings and a final newline. Deployment archive hashes are a different object and must not be compared to a source-file hash.

| Deployed slug | Retrieved source SHA-256 | Relationship to historical repository revision `7bcc61a8db4174867ea99feeecefc0d3bb2080dd` |
| --- | --- | --- |
| `ai-job-hunter` | `3d81611ad8da33400326df92160aa9f0a501c8aa78cd843b66871995b6e33472` (14,451 UTF-8 bytes) | Historical source plus a `CRON_SECRET` declaration and a fail-closed shared-secret check in `run_all`; the old cron comment is replaced. All other source lines match. Historical source hash: `b2763ccb0f9c14c0cecfbba4ba031ca129cac13952684089ab4ef5b2e4dc3182`. |
| `candidate-hunter` | `a013d68801401fea1c438b5903da67e87501332ea812eb8509b02287ae679728` (14,625 UTF-8 bytes) | Exact normalized-text match to historical source. |

Management metadata returned archive hashes `5bccd7e7b718562389ac7320bdc75896f2486fc53d47a3c5167ad2c4409e2b1f` and `901e383e0d5adfe0d3e2e2fdd9ae0a5724749fd15e2ac0ee4eb1a46afa920148`. Neither deployed source matches the current repository's thin entrypoint, which delegates to the secured shared runtime. This proves legacy deployment history; it does not prove a production designation or current traffic.

### Verified handler behavior and resumption risks

Line references in this subsection refer to the **retrieved deployed version 1 `index.ts`** for the named slug, not the rewritten local entrypoint.

- **Cron is secret protected in both actual deployments.** Job Hunter lines 13 and 342–361 reject `run_all` when `CRON_SECRET` is unset or the `x-cron-secret` header differs. Candidate Hunter lines 13 and 346–366 do the same. Per-user actions call `auth.getUser()` and reject a missing user (Job Hunter 337–365; Candidate Hunter 368–375). Therefore `verify_jwt=false` is not, by itself, proof of an unauthenticated endpoint. The earlier historical Job Hunter source lacked this cron check; that specific historical defect is **not present** in the retrieved deployment. Secret presence/strength, scheduler definitions and whether any callers know the secret remain unknown.
- **Paid calls and profile disclosure remain possible if the deployed environment has working credentials.** Both create a service-role Supabase client at lines 9–15 and call the Lovable gateway with `LOVABLE_API_KEY` and `google/gemini-2.5-flash` (Job Hunter 65–85; Candidate Hunter 77–97). Job Hunter sends recorded CV facts/preferences into scoring and cover-letter requests (88–179). Candidate Hunter reads recent CV rows using the service role (223–229), sends candidate facts for scoring/drafting, and persists generated explanation/strengths/gaps for the business (276–291). No current `AI_PROVIDER_ENABLED` switch, durable call-budget RPC, matching-consent/adult-eligibility gate, calendar-sharing gate or reviewed-business authorization appears in either deployed handler. Credentials and billing state were not read, so actual ability to charge or disclose data has not been established.
- **The deployed Job Hunter can insert real applications without per-application approval.** When stored `auto_apply_enabled` is true, `require_user_approval` is false, the model score passes and its count-based daily limit is not reached, lines 275–305 create a submitted draft and write `applications` directly through the service client. `apply_draft` checks draft ownership (372–375), then also inserts directly (377–389). It does not use the new transactional `submit_application` RPC, current eligibility/calendar checks, pause/consent checks or advisory quota lock. Its write sequence spans separate requests and can leave partial draft/match state after failure. The old in-memory/count-based limit is not the new atomic quota. Existing stored settings and possible historical applications have not been inspected.
- **Candidate “sent” is not verified delivery.** `runForBusiness` restricts jobs to the caller's `poster_id` (211–216), and `send_draft` checks `business_id` ownership (382–385). Nevertheless AUTO merely stores `sent:true`, marks a match `outreached` and logs a success claim (293–311). Manual send does the same (387–391). No email, message-provider send or durable student notification delivery appears. Preserve these records as historical claims rather than treating them as proof that a student was contacted.
- **These handlers must not be left running against the new schema.** Service-role direct application writes bypass the new caller-facing RPC/RLS workflow. Database hardening alone cannot retrofit the current role/consent/quota/runtime guarantees onto old deployed code. The current replacements enforce trusted roles, disabled-by-default cron and paid chat, opt-in matching, private-calendar sharing boundaries and controlled application/outreach RPCs; see [shared runtime](../supabase/functions/_shared/runtime.ts#L26), [student matching](../supabase/functions/_shared/runtime.ts#L61), [candidate sharing](../supabase/functions/_shared/runtime.ts#L103), [provider gate](../supabase/functions/_shared/runtime.ts#L141) and [cron gate](../supabase/functions/_shared/runtime.ts#L161). Those replacements have **not** been deployed to this candidate.

**Before any resumption:** first inspect available backup/snapshot metadata and establish a preservation and recovery plan. Investigate existing users/businesses/applications through the already authorized, minimal aggregate inventory once connectivity permits; avoid unnecessary personal records or downloads. Do not resume the project merely to test old handlers. If activation is necessary for inventory or backup, obtain explicit approval for an ordered containment plan that prevents legacy handlers, schedules and paid provider traffic from running during recovery. Endpoint quarantine, secret/schedule changes, backup exports/restores, activation and replacement deployment are separate mutations or data-handling actions and have not been performed. No backup availability, restoration guarantee or safe activation sequence has yet been established.

## Migration inventory

| File | Repository impact |
| --- | --- |
| [1 — 20260409085945](../supabase/migrations/20260409085945_9a063031-db23-4f68-b150-7225b62c118f.sql) | Creates 15 public tables, 13 enums, initial RLS, three functions, Auth/profile creation and updated-time triggers. Inserts private KYC/KYB bucket metadata. |
| [2 — 20260409101157](../supabase/migrations/20260409101157_6c8ac7a4-954c-4c69-ae79-e501f4deb7ab.sql) | Adds `cv_records.file_url`, creates the originally public `cv_files` bucket, adds three owner storage policies. |
| [3 — 20260503150601](../supabase/migrations/20260503150601_4b372c33-04b6-45e0-9d3e-f571cab86922.sql) | Adds five worker-agent tables, an AI-match enum, owner policies/indexes/triggers and three application fields: `is_auto_applied`, `cover_letter_ai`, `match_score`. |
| [4 — 20260626114800](../supabase/migrations/20260626114800_fix_handle_new_user_role_casing.sql) | Replaces `handle_new_user()` to normalize metadata role casing. Replaced again by file 6. No historical profile rows are repaired by this function definition alone. |
| [5 — 20260627000000](../supabase/migrations/20260627000000_candidate_hunter_backend.sql) | Adds four employer-agent tables, the candidate-match enum and owner policies/indexes/triggers. |
| [6 — 20261015110639](../supabase/migrations/20261015110639_student_marketplace_security.sql) | Adds student/calendar/notification/workflow schema, but also replaces authorization, revokes privileges, changes storage configuration, backfills roles and changes existing behavior. It is **not a purely additive migration**. |

A target already containing some historical objects must not be treated as a blank database. Most `CREATE TABLE`, `CREATE TYPE`, `ADD COLUMN`, bucket inserts and named constraints are not idempotent. Do not replay historical files merely because the CLI is not linked or the migration-history table is absent.

## Tables, columns and data classification

The 24 historical public tables are:

`profiles`, `workers`, `businesses`, `jobs`, `applications`, `cv_records`, `chat_sessions`, `kyc_documents`, `attendance`, `ratings`, `bank_accounts`, `wallet_ledger`, `disputes`, `admin_actions`, `user_roles`, `job_preferences`, `ai_agent_settings`, `ai_job_matches`, `ai_application_drafts`, `ai_agent_logs`, `candidate_hunter_settings`, `candidate_matches`, `candidate_outreach_drafts`, `candidate_hunter_logs`.

File 6 adds eight tables, with 61 columns collectively:

| New table | Purpose / protection |
| --- | --- |
| `public.student_profiles` | Academic profile and self-declared eligibility/consent; owner CRUD. No employer read policy. |
| `public.availability_preferences` | Preferred windows, timezone, duration, travel buffer and explicit employer-sharing flag; owner CRUD. |
| `public.academic_calendar_events` | Generic busy intervals without titles; owner CRUD, no employer read. |
| `public.calendar_connections` | Provider/status/sync metadata; owner SELECT only. Import/disconnect RPCs author changes. |
| `public.notifications` | Recipient SELECT and `read_at` UPDATE only; server-authored content and dedupe key. |
| `public.application_audit_logs` | Participant/admin SELECT; writes occur through hiring RPCs. |
| `taawun_private.calendar_credentials` | Future encrypted token custody; no client table privileges. A bytea column alone does not implement encryption or OAuth. |
| `taawun_private.ai_usage` | Internal quota counters, including a global paid-chat counter; no client table privileges. |

Definitions begin at [file 6:20](../supabase/migrations/20261015110639_student_marketplace_security.sql#L20). `notifications.dedupe_key` is added at [line 349](../supabase/migrations/20261015110639_student_marketplace_security.sql#L349).

Sixteen columns are added to existing tables:

| Existing table | Added columns / initial values for existing records |
| --- | --- |
| `profiles` | `account_initialized = false` |
| `workers`, `businesses` | Nullable `verification_reviewed_at`, `verification_reviewed_by` |
| `applications` | Nullable `interview_at`, `employer_message`, `decision_at` |
| `jobs` | `schedule_kind = 'unspecified'`, `country = 'AE'`, `student_friendly = true`, nullable `eligibility_requirements` |
| `ai_agent_settings` | `mode = 'APPROVAL'`, nullable `auto_apply_consented_at`, `paused = false` |
| `candidate_hunter_settings` | `paused = false` |

See [file 6:9](../supabase/migrations/20261015110639_student_marketplace_security.sql#L9) and [line 412](../supabase/migrations/20261015110639_student_marketplace_security.sql#L412).

**Legacy-data consequences requiring an authorized review:**

1. Existing job records receive `AE`, `student_friendly=true` and `schedule_kind='unspecified'`; those defaults do not prove that an old job is in the UAE, suitable for students or has flexible hours. Historical fixed shifts need deliberate classification before use. No automatic classification script is included.
2. Only the defaults of `jobs.currency` and `job_preferences.salary_currency` change from SAR to AED. Existing values are **not converted**, and amounts are not exchanged. Old SAR listings will not pass the new UAE/AED discovery filter.
3. Existing verified businesses receive null reviewer-evidence columns. `verified_business()` requires both trusted business role and reviewer evidence from an admin. Therefore historical flags alone no longer authorize publishing, public listing visibility, candidate matching or offer acceptance. Records are retained, but re-review is required. The migration does not fabricate reviewer evidence.
4. Old workers have no automatic student-profile/availability/age/eligibility backfill. Existing accounts must complete setup/declarations before new applications or acceptance. No existing legal eligibility is inferred.
5. Existing application statuses, accepted-placement capacity counts and historical audit evidence are not recalculated. Capacity/history consistency needs the already authorized aggregate review once connectivity permits; examine personal records only if separately justified and necessary.
6. `require_user_approval` gets a new **default** of true; existing false values remain. New handlers still require individual approval and perform no automatic submissions, regardless of legacy flags.

## Immediate writes versus future runtime writes

The sixth file contains these immediate data-affecting operations:

| Operation | Actual effect |
| --- | --- |
| [Role backfill, line 58](../supabase/migrations/20261015110639_student_marketplace_security.sql#L58) | For profiles having **no** `user_roles` row, inserts business when `profiles.role='business'`, otherwise worker. It does not insert an admin role, remove existing grants, reconcile multiple roles or establish the provenance of historical admin grants. It reads existing profiles/roles when eventually applied. |
| New columns with defaults | Existing rows acquire the initial values listed above, whether implemented physically or using PostgreSQL's fast-default mechanism. |
| [Storage updates, line 152](../supabase/migrations/20261015110639_student_marketplace_security.sql#L152) | Changes bucket configuration for existing matching bucket IDs. It does not move, download or delete file bytes. |

The migration has no top-level application-record `DELETE` or blanket job/profile rewrite. Function bodies containing writes are installed definitions; they do not execute simply because the functions are created. Later authorized calls can have consequential effects:

- `complete_account_setup` can replace a caller's worker/business role rows during guarded first-time initialization; it cannot grant admin.
- Verification RPCs change documents/accounts and append audit/notification records. Rejecting a document revokes the associated account's verification immediately.
- Hiring RPCs insert applications, update controlled statuses and capacity, finalize prepared drafts, and append audit/notification records atomically.
- `replace_calendar_import` **deletes and replaces the caller's ICS events** in a transaction; `disconnect_calendar` deletes only the caller's selected-provider events and connection. Connection deletion cascades to that connection's private credentials. These are explicit user actions, not migration-time cleanup.
- Quota RPCs update private counters. Candidate outreach sends a durable, deduplicated in-app invitation; it does not send email or make a third-party submission.

No payroll, employment-contract, placement-fee or payment-provider activation is part of the SQL.

## RLS policy replacements

[File 6:96](../supabase/migrations/20261015110639_student_marketplace_security.sql#L96) dynamically drops **every policy** on 16 named public tables. It is not limited to policy names present in Git. Out-of-band policies on those tables would also be removed. Snapshot and review them before authorizing application.

| Tables | Resulting access model |
| --- | --- |
| `profiles`, `workers` | Owner, admin or an employer with an actual application may read; owner updates only granted safe columns. Matching consent alone does not disclose contact details. |
| `businesses` | Owner/admin table reads. Public employer identity uses a bounded, reviewed summary RPC. |
| `jobs` | Public reads only current open/deadline-valid jobs from reviewed employers; owner/admin/applicants retain relevant history. Verified owner inserts/updates; deletion only draft/no-applications. The **final** policies replace intermediate definitions at [lines 418–421](../supabase/migrations/20261015110639_student_marketplace_security.sql#L418). |
| `applications` | Participant/admin SELECT; browser inserts/updates/deletes removed. All decisions use guarded RPCs. |
| `cv_records` | Owner CRUD; admin and the student's actual job-poster recipients can read. |
| `kyc_documents` | Owner/admin read; owner inserts only submitted, correctly owned records; owner can delete non-approved records. Reviews are RPC-only. |
| `attendance` | Participant/admin read; browser writes removed. |
| `admin_actions`, `user_roles` | Trusted-role-scoped reads; no browser-authored grants or admin audit entries. |
| `ai_job_matches`, `ai_agent_logs`, `candidate_matches`, `candidate_hunter_logs` | Owner/employer-scoped reads; no browser-authored scores/logs. Employer access requires verification. |
| `ai_application_drafts`, `candidate_outreach_drafts` | Owner/employer reads; narrow edits to unsent/unsubmitted content only. Submission/sending flags remain server controlled. |

Historical policies are retained on `chat_sessions`, `ratings`, `bank_accounts`, `wallet_ledger`, `disputes`, `job_preferences`, `ai_agent_settings` and `candidate_hunter_settings`. Retention is not a fresh endorsement of deferred legacy workflows. Dispute admin checks inherit the safer replacement of `public.has_role()`.

The six new public tables get RLS. Calendar tables have no employer read policy. Calendar sharing is implemented by the guarded matching handler: no event/sync reads or calendar-derived employer explanations when `share_with_employers=false`. PostgREST exposure configuration must keep `taawun_private` unexposed.

## Grants and service access

### Table and column ACLs

- **Schema-wide anonymous revoke:** [line 97](../supabase/migrations/20261015110639_student_marketplace_security.sql#L97) revokes all table-level privileges from `anon` on **all existing public-schema tables**, including tables not named by this repository. Only jobs table SELECT is regranted; the employer-summary RPC is separately public. This can break unrelated public features if the target shares a schema with another app.
- Authenticated INSERT/UPDATE/DELETE are revoked on the protected identity, hiring, role, audit and AI-result tables listed at [line 98](../supabase/migrations/20261015110639_student_marketplace_security.sql#L98). KYC, attendance and jobs have additional revokes. RLS and ACLs both apply.
- These are not universal clean-slate ACL resets. Except where explicitly reset, inherited grants, custom column privileges, `PUBLIC` grants and supplemental privileges such as TRIGGER/REFERENCES/TRUNCATE are not comprehensively removed. The local fixture grants ALL on historical tables; actual target defaults/role memberships must be inspected.
- New student/calendar tables are reset to owner CRUD, then connection INSERT/UPDATE/DELETE is removed at [line 450](../supabase/migrations/20261015110639_student_marketplace_security.sql#L450). Notifications and application audits receive explicit restricted grants.
- Authenticated CRUD is explicitly granted on `cv_records`, `chat_sessions`, `job_preferences`, `ai_agent_settings` and `candidate_hunter_settings`; their RLS still limits rows. Deferred tables otherwise retain their authenticated ACLs.

The explicit authenticated column grants are:

| Table | Allowed columns / operation |
| --- | --- |
| `profiles` | UPDATE `full_name`, `phone`, `avatar_url`, `city`, `country` |
| `workers` | UPDATE `skills`, `bio`, `availability` |
| `businesses` | UPDATE `trade_name`, `legal_name`, `sector`, `size`, `logo_url` |
| `jobs` | UPDATE the 28 listing-content/status/schedule/pay columns enumerated at [line 111](../supabase/migrations/20261015110639_student_marketplace_security.sql#L111); excludes owner IDs, filled slots and immutable identity fields |
| `kyc_documents` | INSERT `owner_id`, `owner_role`, `doc_type`, `storage_path`, `status`; policy requires submitted status |
| `ai_application_drafts` | UPDATE `cover_letter`, `notes` before submission |
| `candidate_outreach_drafts` | UPDATE `outreach_message`, `notes` before sending |
| `notifications` | UPDATE `read_at` only |

No new schema-wide public-table service grant is present. Explicit new service permissions are SELECT on the four matching-input tables (`student_profiles`, `availability_preferences`, `academic_calendar_events`, `calendar_connections`), execution of the public employer-summary and scheduled-budget RPCs, and ALL on the private schema's tables. See [lines 341–342](../supabase/migrations/20261015110639_student_marketplace_security.sql#L341) and [lines 438–450](../supabase/migrations/20261015110639_student_marketplace_security.sql#L438).

`CREATE SCHEMA IF NOT EXISTS taawun_private` is followed by schema-wide table/function privilege changes. If that schema already exists with unrelated objects, stop and assess the wider impact. Service operations on historical AI tables depend on actual existing/default service grants; the local test fixture cannot establish hosted grants.

### Functions

The final replay contains 16 public functions and 11 private helpers. `public.has_role()` and `handle_new_user()` are replaced; the updated-time trigger helper remains.

| Public function execution | Intended caller / authorization |
| --- | --- |
| `get_public_businesses(uuid[])` | `anon`, authenticated and service role; at most 50 IDs, reviewed public summaries only |
| `consume_ai_budget_for_user(uuid,text)` | Service role only; PUBLIC/anon/authenticated execution explicitly revoked at [line 389](../supabase/migrations/20261015110639_student_marketplace_security.sql#L389) |
| `complete_account_setup`, `request_verification`, `review_verification_document`, `review_verification`, `submit_application`, `update_application_status`, `consume_ai_budget`, `disconnect_calendar`, `replace_calendar_import`, `send_candidate_outreach`, `get_candidate_summaries` | Authenticated entry points with caller, ownership, role/admin or consent checks inside; authentication alone does not authorize arbitrary targets |
| `has_role(uuid,app_role)` | Authenticated, constrained to self or trusted admin lookup |
| `handle_new_user()` | Trigger owner only; client execution revoked |
| `update_updated_at_column()` | Existing invoker trigger function; baseline execute ACL retained, returns trigger |

New privileged entry points use empty `search_path` and qualified object references. Private helpers have owner-only execution except the narrowly granted RLS predicates (`is_admin`, `has_role`, `verified_business`, `can_view_candidate`, `has_application`, `job_has_applications`). Schema USAGE is granted to API roles so policies can resolve helpers; this is not permission to read private tables or expose that schema through the Data API.

Edge handlers must be deployed as the matching version of this release. The SQL does not replace a previously deployed service-role handler, revoke an old cron secret, disable an existing schedule or remove old provider secrets. A vulnerable old handler could still bypass RLS. Actual deployed function versions are unknown; staged rollout must first contain old unsafe entry points and keep paid/cron gates off.

## Storage changes

Historical files insert bucket records without conflict handling: [KYC/KYB inserts](../supabase/migrations/20260409085945_9a063031-db23-4f68-b150-7225b62c118f.sql#L336) and [CV bucket insert](../supabase/migrations/20260409101157_6c8ac7a4-954c-4c69-ae79-e501f4deb7ab.sql#L6). Existing buckets with unrecorded history can make replay fail.

File 6 makes `cv_files` private; sets its file-size limit to 15,728,640 bytes and restricts MIME types to PDF, DOC, DOCX, JPEG and PNG. KYC/KYB bucket limits become 15,728,640 bytes with PDF/JPEG/PNG/WebP/HEIC allowed. Existing objects are retained; larger/other existing files are not automatically cleaned up. Missing bucket IDs make these UPDATEs affect zero rows rather than create buckets.

The six historical `storage.objects` policies remain. Two are added: employers can read CV objects belonging to their actual applicants, and owners can delete KYC objects only when not referenced by an approved document. Storage policy count becomes eight. No general employer access to KYC files is added. See [file 6:152–155](../supabase/migrations/20261015110639_student_marketplace_security.sql#L152).

Old public CV URLs stop working after bucket privacy changes. The new frontend uses signed URLs; older deployed clients and cached links may break. Rolling the bucket back to public would reopen a privacy defect and is not a safe rollback. Real signed URL, upload, MIME and deletion behavior needs Storage-service testing after authorization; catalog replay cannot prove it.

## Constraints, indexes, triggers and workflow behavior

- Four labels are appended: application `interview`, `offered`, `placed`; AI match `submitted`. Enum types are retained. New labels are not simply removable after commit.
- [File 6:18–19](../supabase/migrations/20261015110639_student_marketplace_security.sql#L18) adds validated score range 0–100 and daily limit 0–25 checks to **existing** AI-settings tables. Existing out-of-range records can abort the migration. No clamping/deletion is performed.
- New-table constraints cover owner/parent foreign keys, unique provider/event identity, valid provider/status/mode choices, graduation year, positive event duration, bounded durations/buffers and JSON window shape. A trigger checks IANA timezone and preferred-window values. Notification dedupe is unique.
- Nullable reviewer foreign keys target `auth.users`. Four additional job foreign keys on AI matches/drafts and candidate matches/drafts are deliberately **NOT VALID**, with `ON DELETE CASCADE`, at [lines 345–348](../supabase/migrations/20261015110639_student_marketplace_security.sql#L345). Legacy orphans are preserved; new inserts/key changes are constrained. Historical validation and delete-cascade impact require the already authorized read-only aggregate audit once candidate connectivity permits; any resulting repair requires separate approval. No automatic child FK indexes are created by PostgreSQL.
- Thirteen project indexes are added: new-table primary/unique indexes and the two explicit calendar/notification indexes. Existing historical indexes remain.
- Four triggers are added: student updated time, availability updated time, availability validation and job security guard. Existing Auth and updated-time triggers remain, with signup behavior changed by the replaced function. See [line 150](../supabase/migrations/20261015110639_student_marketplace_security.sql#L150), [line 172](../supabase/migrations/20261015110639_student_marketplace_security.sql#L172), [line 379](../supabase/migrations/20261015110639_student_marketplace_security.sql#L379).
- The job guard runs on later INSERT/UPDATE; it does not scan and repair old listings. It rejects invalid schedules/pay/capacity, protects accepted terms and prevents returning a job with applications to draft.
- Application RPCs lock the job and application/draft as appropriate, enforce ownership and transition rules, prevent duplicates, recheck eligibility/availability on acceptance and create durable notices/audit entries. Prepared applications add a per-student advisory lock and current consent/pause/filter/fact/score/daily-limit checks.
- Calendar import replacement uses a per-user advisory lock and one transaction; invalid imports roll back replacement. Connected ICS snapshots fail closed beyond the 120-day known horizon plus travel buffer. No live Google/Microsoft OAuth connection lifecycle is activated by this schema.

## Transaction, rollout and rollback risks

1. The SQL file contains no explicit outer BEGIN/COMMIT. Verify the chosen migration runner's transaction behavior on PostgreSQL 17 in a disposable, authorized rehearsal. Do not assume that pasting individual statements into an editor preserves atomicity. File 6's enum additions are used by stored function bodies; exercise those functions after commit on the actual engine.
2. DDL on existing tables, validated CHECK scans, role backfill and ACL/policy replacement can acquire locks, block signups/writes or time out. The file has no explicit lock/statement timeout or batched backfill. Record table sizes through the authorized aggregate inventory before estimating the window; use a rehearsed maintenance/write-containment plan.
3. Partial manual application is hazardous: policy drops, broad anonymous revocation, privacy changes and function replacement must not be left half applied. Most statements are not safely rerunnable. Reconcile the migration runner's history and actual catalogs before retrying.
4. Coordinated frontend/function/schema versions are required. Old clients perform direct writes now denied; old service-role functions can bypass new RPC rules. Keep automatic/paid features and schedules disabled, and contain old endpoints before an authorized rollout.
5. No down migration exists. Removing tables/columns/enums or restoring a backup can lose newly created data. Restoring old permissive RLS, public CV access or unguarded service handlers is not an acceptable functional rollback. Prefer containment and a reviewed forward correction; any restore requires separate approval and an explicit data-loss assessment.
6. Schema changes and storage configuration are database state; function deployments, secrets, schedules, provider tokens, Auth redirect settings and frontend assets have separate lifecycles. A database transaction cannot roll all of them back together.

## Schema-only preflight — prepared, not executed on a cloud project

Run only after the target and access action are explicitly confirmed. These statements inspect catalogs/configuration, not application rows. Capture results privately; schema/function ACLs can reveal internal architecture. The connection hostname/project reference must be verified outside SQL because many Supabase databases share the name `postgres`.

```sql
BEGIN TRANSACTION READ ONLY;

-- Engine and exposure configuration; NULL may mean a managed setting is not visible here.
SELECT current_database() AS database_name, current_user AS inspection_role,
       version() AS engine_version,
       current_setting('pgrst.db_schemas', true) AS exposed_schemas,
       current_setting('search_path', true) AS session_search_path;

-- Identify existing schemas/tables, extra public objects and RLS state.
SELECT n.nspname AS schema_name, n.nspowner::regrole AS owner, n.nspacl
FROM pg_namespace n
WHERE n.nspname IN ('public','taawun_private','auth','storage','supabase_migrations');
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relowner::regrole AS owner, c.relrowsecurity, c.relforcerowsecurity, c.relacl
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.relkind IN ('r','p') AND n.nspname IN ('public','taawun_private')
ORDER BY 1,2;
SELECT to_regclass('supabase_migrations.schema_migrations') AS migration_history_table,
       to_regclass('auth.users') AS auth_users_table,
       to_regclass('storage.buckets') AS buckets_table,
       to_regclass('storage.objects') AS objects_table;

-- Columns/defaults and enum labels reveal partial application or drift.
SELECT n.nspname AS schema_name, c.relname AS table_name, a.attname AS column_name,
       format_type(a.atttypid,a.atttypmod) AS data_type, a.attnotnull,
       pg_get_expr(d.adbin,d.adrelid) AS default_expression, a.attacl
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind IN ('r','p')
  AND n.nspname IN ('public','taawun_private') ORDER BY 1,2,a.attnum;
SELECT n.nspname, t.typname, e.enumlabel, e.enumsortorder
FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname='public'
ORDER BY 1,2,4;

-- Snapshot every policy, including out-of-band policies that file 6 would replace.
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname IN ('public','storage') ORDER BY 1,2,3;
SELECT n.nspname,c.relname,k.conname,k.contype,k.convalidated,
       pg_get_constraintdef(k.oid) AS definition
FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('public','taawun_private') ORDER BY 1,2,3;
SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
WHERE schemaname IN ('public','taawun_private') ORDER BY 1,2,3;
SELECT n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname IN ('public','auth') ORDER BY 1,2,3;

-- Function entry points, owner/search_path and explicit/default ACLs; no function execution.
SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,
       p.proowner::regrole AS owner,p.prosecdef,p.proconfig,p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','taawun_private') ORDER BY 1,2,3;
SELECT defaclrole::regrole AS owner_role,
       CASE WHEN defaclnamespace=0 THEN '(global)' ELSE defaclnamespace::regnamespace::text END AS schema_name,
       defaclobjtype,defaclacl FROM pg_default_acl ORDER BY 1,2,3;
SELECT rolname,rolcanlogin,rolinherit,rolbypassrls FROM pg_roles
WHERE rolname IN ('anon','authenticated','service_role');
SELECT roleid::regrole AS granted_role,member::regrole AS member_role,admin_option
FROM pg_auth_members ORDER BY 1,2;

-- Effective API/service privileges; existing explicit column ACLs are listed above.
SELECT n.nspname,c.relname,r.role_name,
       has_table_privilege(r.role_name,c.oid,'SELECT') AS can_select,
       has_table_privilege(r.role_name,c.oid,'INSERT') AS can_insert,
       has_table_privilege(r.role_name,c.oid,'UPDATE') AS can_update,
       has_table_privilege(r.role_name,c.oid,'DELETE') AS can_delete,
       has_table_privilege(r.role_name,c.oid,'TRUNCATE') AS can_truncate,
       has_table_privilege(r.role_name,c.oid,'TRIGGER') AS can_trigger
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN (VALUES('anon'),('authenticated'),('service_role')) r(role_name)
WHERE c.relkind IN ('r','p') AND n.nspname IN ('public','taawun_private')
ORDER BY 1,2,3;

ROLLBACK;
```

Use the connected authorized identity; do not change role grants or access configuration to work around errors. Missing schemas/roles, unexposed managed settings, permission errors or timeout results are findings to record, not evidence of absence. The schema-only script deliberately does **not** read `storage.buckets`, migration-history records or Auth/application tables. The owner's latest authorization also permits read-only candidate bucket configuration, migration-history and backup metadata, and aggregate inventory once connectivity permits; no additional read-only approval is needed for that scope. Those reads were not executed for this report.

## Authorized aggregate data audit — not performed because hosted connectivity is unavailable

The owner authorized non-destructive investigation of existing users, businesses, applications, important data, production-use evidence and backups on the candidate. Proceed with minimal schema/metadata and aggregate checks once connectivity permits; unnecessary record-level personal information or downloads are not needed. Necessary aggregate checks include: rows violating the four validated settings checks; profiles with no role row; privileged-role counts and trusted grant provenance; legacy verified accounts lacking fresh evidence; orphan references on all four NOT VALID job FKs; duplicate/inconsistent application/capacity records; legacy country/currency/schedule classification; bucket existence/configuration and oversized/unsupported historical objects. Aggregate counts alone cannot validate a person's role provenance, legal eligibility or document authenticity.

Example **aggregate-only** SQL within the authorized read-only scope, prepared for later execution once connectivity and the historical baseline tables are confirmed:

```sql
-- DATA READS: do not include in the schema-only preflight above.
SELECT 'worker_agent_settings_out_of_range' AS metric,count(*) AS affected
FROM public.ai_agent_settings
WHERE minimum_match_score NOT BETWEEN 0 AND 100 OR daily_application_limit NOT BETWEEN 0 AND 25
UNION ALL
SELECT 'employer_agent_settings_out_of_range',count(*)
FROM public.candidate_hunter_settings
WHERE minimum_match_score NOT BETWEEN 0 AND 100 OR daily_outreach_limit NOT BETWEEN 0 AND 25;

SELECT count(*) AS profiles_targeted_by_role_backfill
FROM public.profiles p
WHERE NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.user_id);

SELECT 'ai_job_matches' AS source_table,count(*) AS orphan_job_references
FROM public.ai_job_matches m LEFT JOIN public.jobs j ON j.id=m.job_id WHERE j.id IS NULL
UNION ALL SELECT 'ai_application_drafts',count(*)
FROM public.ai_application_drafts m LEFT JOIN public.jobs j ON j.id=m.job_id WHERE j.id IS NULL
UNION ALL SELECT 'candidate_matches',count(*)
FROM public.candidate_matches m LEFT JOIN public.jobs j ON j.id=m.job_id WHERE j.id IS NULL
UNION ALL SELECT 'candidate_outreach_drafts',count(*)
FROM public.candidate_outreach_drafts m LEFT JOIN public.jobs j ON j.id=m.job_id WHERE j.id IS NULL;
```

No such query was executed against either cloud reference. Do not fix a positive count with automatic deletes, value clamping, role resets or an unreviewed replacement database. Prepare a separate, reviewable remediation proposal with preservation and rollback details.

## Approval gates remaining

1. Continue the authorized read-only candidate identity, backup-metadata, schema/history, bucket and aggregate inventory where accessible. Leave the original project untouched. Record inactivity/timeouts as unresolved limitations, not empty results.
2. Before activation, establish a backup-first recovery plan and obtain explicit approval for an ordered containment/activation action; account for both legacy deployed handlers described above. Do not blindly resume for inspection.
3. Compare all custom objects/policies/ACLs, engine behavior and history against these six files. Reconcile aggregate findings about incompatible settings, orphan references, privileged roles, legacy verification, listing classification and placement history. Any export/restore, record mutation, remediation or access-configuration change needs separate review and approval.
4. Obtain explicit approval for the exact migration rehearsal and negative-access tests on a confirmed staging environment. Validate real Auth/PostgREST/Storage behavior, service grants and supported advisors within that scope.
5. Obtain explicit approval for the coordinated migration, function/frontend deployment and secrets/schedule changes. Keep paid AI and cron disabled; preserve a forward-correction/containment plan.

This preparation changes only this report and ignored local scratch artifacts. No existing migration, application source, test, cloud project or hosted record was changed, and no commit was created for this task.
