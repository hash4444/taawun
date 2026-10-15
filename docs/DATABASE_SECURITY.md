# Database security and privacy

Scope: checked-in migrations and functions, verified locally. No linked cloud database was changed. Migration `20261015110639_student_marketplace_security.sql` is additive to the five historical migrations and was generated using the Supabase CLI. Existing history has not been rewritten.

## Trust boundaries

- Identity comes from verified Supabase sessions; roles come from `public.user_roles`. User metadata never grants administrative privileges. Signup initializes only a public student/employer intent once; privileged role assignment requires a trusted operator.
- Profile updates are column-restricted. Students/employers cannot write roles, verification approval/reviewer fields, employer decisions, AI-produced match state, quotas, notification recipients or audit logs directly.
- Verification submission/document review/final account review use authenticated RPCs. Admin role checks and reviewer evidence back approved businesses. Existing `verified` values without trusted review evidence do not authorize publishing. Historical admin grants also require a human audit before launch; no destructive reset of existing roles has been applied.
- Application RPCs lock rows, validate job ownership and permitted transitions, reject duplicates/closed/expired/full jobs and create notifications/audit records transactionally. Students accept their own offers; employers decide only on applications to their own jobs. Agreed material terms are protected after acceptance; deleting jobs cannot cascade applicant history.
- SQL functions with elevated privileges set an empty search path and qualify objects. Mutation RPCs reject anonymous callers and check `auth.uid()` and trusted roles. Narrow boolean policy helpers and the bounded public employer-summary read have intentional anonymous execution grants; other new functions receive only their explicit caller grants. Internal helpers live in a non-exposed schema. Service-only quota entry points are not user-callable.

## Data access matrix

| Resource | Student | Employer | Admin / service |
| --- | --- | --- | --- |
| Profiles | Own | Relevant applicants / consent-scoped candidate profile access only | Authorized administrative/service operations |
| CV records/files | Own | Relevant applicants only | Authorized administrative/service operations |
| Business KYB/profile | No private company record access | Own | Verification review |
| Public employer summaries | Safe verified-company fields only | Safe fields | Bounded directory RPC |
| Jobs | Open listings + own application history | Own management | Authorized review |
| Applications | Own history/allowed responses | Own jobs only | Authorized service operations |
| Calendars/preferences | Own | No event/token access | Matching service uses busy intervals only |
| Verification documents | Own uploads/status | Own uploads/status | Admin review, signed URLs |
| Notifications | Own read/read-state only | Own read/read-state only | Server creates recipients/content |
| Audit/quotas | No direct edits | No direct edits | Server owns immutable decisions/counters |

Private storage replaces the historical public CV bucket. CV links are object paths and short-lived signed URLs; storage RLS protects owner paths and relevant applicant access. KYC storage paths bind to the authenticated owner within the document bucket; the UI supplies document-type filenames, while SQL validates the submitted document type separately. Approved files cannot be self-replaced/deleted through broad owner grants.

Calendar tables use owner RLS, generic busy intervals and private connection status. Provider credentials have a separate private schema table, never exposed to frontend roles. No provider token has been collected or persisted. ICS replacement/disconnect affects only the authenticated caller/source and runs atomically. No employer receives personal timetable contents. Employer recommendations consult private event/coverage data only with explicit availability-sharing consent; otherwise fixed-shift fit remains unknown with generic confirmation text, preventing timetable inference through match explanations.

## AI boundaries

All function handlers validate JWTs with Auth and use trusted roles. Cron requires a separate long secret and explicit enable flag; both default off. Requests, message length, scan sizes, event counts and provider timeouts are bounded. Durable PostgreSQL counters enforce account and spending limits. Paid chat remains disabled by default. Automatic applications remain disabled; approval submissions recheck the student's current permission/preferences and daily limits.

Deterministic rules check eligibility declarations, relevant hard requirements, pay/location restrictions and timetable compatibility; relevance scores cannot override them. Shared browser/Edge and server SQL checks agree on timezone/DST window coverage. Provider adapters fail on partial responses rather than reporting a falsely free timetable.

## Verification limits and launch gates

PGlite tests execute real PostgreSQL RLS/functions against substitute Auth/Storage schemas. They cannot prove a hosted project's grants, authentication, storage service or deployed function state. Deno HTTP tests mock network calls. Real Supabase staging replay, advisors, role/storage negative tests, historical-account audit, backup/restore and privacy retention/deletion operations remain mandatory before launch. No claim of legal work eligibility is derived from a checkbox.

Official review references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions), [storage access control](https://supabase.com/docs/guides/storage/security/access-control).
