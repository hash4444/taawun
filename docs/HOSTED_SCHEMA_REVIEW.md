# Hosted schema review and staging adoption proposal

Prepared 2026-10-15 for **`xhogffnpjaoxkgoiwcty` only**, after the owner reported restoration and root verified `ACTIVE_HEALTHY`, PostgreSQL image `17.6.1.141`. The SQL connection reported engine `17.6`. This review supersedes the inactive-project/schema-unknown limitation in earlier reports for the catalog facts below. The original project `fvnemfbqpmweqzhzuflu` was not contacted.

**Decision:** the candidate contains the historical application schema with a missing CV column and two extra hardening migrations. Adopt it through the isolated, locally rehearsed migration context below. Do not run `db push` from the repository's canonical migration directory, replay its historical files, repair/rewrite hosted migration history, reset the database or infer that empty current tables establish an absence of prior production use. **No hosted write or dry run has been performed.**

## Scope and evidence

The owner authorized non-destructive schema/metadata and aggregate investigation. This agent read PostgreSQL catalogs in explicit `BEGIN READ ONLY` transactions, each with `SET LOCAL statement_timeout='15s'`, and committed only the read-only transactions. It inspected tables/columns/enums, constraints, indexes, triggers, RLS/policies, schema/table/column/default grants and routine metadata/digests. `list_migrations` and a read-only operational-metadata query retrieved the six hosted history entries and their recorded statements for local rehearsal. No hosted function source was printed: catalog MD5 digests were compared with locally replayed historical bodies. No Auth or application records were read by this agent.

Root separately reported current counts of zero for Auth users and all 24 public application tables, plus no current identities, sessions, MFA or Auth audit records. The operational agent reported three private storage buckets and zero objects. These are current-state observations, not proof that the project was never used or that a historical archive exists. Root owns those aggregate and advisor reports. Existing Edge Functions remain a separate deployment/containment concern described in [MIGRATION_IMPACT_REPORT.md](MIGRATION_IMPACT_REPORT.md).

No credentials, secret values, personal records, original-project metadata or external provider endpoints were read. No cloud DDL/DML, history repair, function deployment, Vault update or project configuration change was performed. Only this report and ignored local staging artifacts were created; canonical source and migration files were not edited.

## Exact schema comparison

| Catalog | Hosted now | Canonical historical files 1–5 | Expected after adoption |
| --- | ---: | ---: | ---: |
| Public tables | 24 | 24 | 30 |
| Private application tables | 0 | 0 | 2 in `taawun_private` |
| Application columns | 249 | 250 | 327 |
| Enum types / labels | 15 / 66 | 15 / 66 | 15 / 70 |
| Public + private routines | 3 | 3 | 27 |
| User triggers, including Auth signup | 19 | 19 | 23 |
| Application indexes | 37 | 37 | 50 |
| Public + Storage policies | 85 | 85 | 69 |

All 24 hosted public tables have RLS enabled, no table has FORCE RLS, and their owner is `postgres`. No public view, materialized view or sequence was returned by this inventory. `taawun_private` does not exist yet. The public schema is owned by `pg_database_owner`; its observed ACL provides PUBLIC usage and named anon/authenticated/service usage, without PUBLIC CREATE.

**Sole structural difference from the canonical five-file historical replay:** `public.cv_records.file_url text` is absent. All other 249 column types, nullability and default expressions match. In particular, hosted `jobs.currency` and `job_preferences.salary_currency` retain the historical SAR defaults; the pending security migration changes future defaults to AED.

All 85 policy names, roles, commands and expressions match the historical replay exactly. All 37 index definitions, all 19 trigger definitions and all **62 non-NOT-NULL constraints** match exactly when using identical catalog deparser settings. These comprise 27 foreign keys, 24 primary keys, nine unique constraints and two CHECKs. There are no additional public application objects in these compared categories.

The local PGlite engine is PostgreSQL 18.6, which separately catalogs NOT NULL constraints; its historical constraint total of 222 must not be mistaken for 160 missing hosted constraints on PostgreSQL 17. Formatting-only schema qualification and CHECK-parenthesis differences were eliminated by querying identical deparser settings.

## Hosted history is different from local filenames

The actual recorded history is:

| Hosted version | Recorded name |
| --- | --- |
| `20260713113724` | `20260409085945_9a063031-db23-4f68-b150-7225b62c118f` |
| `20260713113756` | `20260503150601_4b372c33-04b6-45e0-9d3e-f571cab86922` |
| `20260713113803` | `20260626114800_fix_handle_new_user_role_casing` |
| `20260713113811` | `20260627000000_candidate_hunter_backend` |
| `20260713114015` | `private_cv_storage` |
| `20260713114151` | `restrict_security_definer_functions` |

The four application-history names correspond to canonical files **1, 3, 4 and 5**, but their recorded versions are July timestamps rather than the April–June versions in the repository. The repository's file 2, [CV file column/public bucket](../supabase/migrations/20260409101157_6c8ac7a4-954c-4c69-ae79-e501f4deb7ab.sql#L3), is not recorded. Its three storage policies exist because the hosted `private_cv_storage` migration independently creates them and a **private**, rather than public, CV bucket; it deliberately does not add `cv_records.file_url`.

The recorded `restrict_security_definer_functions` migration restricts `handle_new_user` execution and replaces `has_role` with SECURITY INVOKER, revoking PUBLIC/anon execution. These are genuine hosted history entries and must be retained.

The security migration `20261015110639_student_marketplace_security` is not recorded or structurally present. Its six public tables, private schema/tables, workflow RPCs, reviewer fields and calendar fields are absent.

A normal CLI history comparison uses version identifiers, not semantic similarity of SQL. Consequently the canonical repository history does not align with the six hosted versions. Forcing inclusion would try to recreate existing types/tables/policies. Replaying file 2 would collide with the existing CV bucket/policy names and includes an obsolete public-bucket insertion. Marking every old file applied would falsely claim that the missing `file_url` change had been installed. **Neither `--include-all` nor migration repair is an acceptable shortcut.**

## Types and enum compatibility

All enum definitions and ordering exactly match the historical repository:

| Enum | Hosted labels in order |
| --- | --- |
| `ai_match_status` | `matched`, `drafted`, `auto_applied`, `needs_review`, `skipped`, `rejected` |
| `app_role` | `worker`, `business`, `admin` |
| `application_status` | `applied`, `shortlisted`, `accepted`, `rejected`, `cancelled`, `completed` |
| `attendance_method` | `qr`, `gps`, `manual` |
| `candidate_match_status` | `matched`, `drafted`, `outreached`, `needs_review`, `skipped`, `rejected` |
| `dispute_status` | `open`, `review`, `resolved`, `rejected` |
| `doc_status` | `submitted`, `approved`, `rejected` |
| `doc_type` | `id_front`, `id_back`, `selfie`, `commercial_reg`, `license`, `rep_id` |
| `employment_type` | `permanent`, `temporary`, `contract` |
| `job_status` | `draft`, `open`, `in_progress`, `completed`, `closed`, `cancelled` |
| `job_type` | `shift`, `full_time`, `part_time`, `freelance`, `digital_service`, `internship` |
| `payment_model` | `hourly`, `fixed`, `monthly`, `milestone` |
| `service_direction` | `business_offers`, `worker_offers` |
| `wallet_entry_status` | `pending`, `approved`, `paid`, `rejected` |
| `wallet_entry_type` | `earning`, `payout`, `bonus`, `deduction` |

The pending security SQL adds `application_status.interview`, `offered`, `placed` and `ai_match_status.submitted` with `IF NOT EXISTS`. There is no conflicting existing label, reordered type or incompatible enum name in the observed schema. The application already uses the existing `shortlisted`, `internship`, `hourly/fixed/monthly` and lower-case role labels. File 6's new agent mode is a text CHECK, separate from these enums.

## Existing authorization and routine metadata

RLS being enabled does not supply the pending security boundary. Hosted anon, authenticated and service roles retain broad table ACLs on every public application table; the raw ACL includes the full table privilege set. The information-schema projection exposes 504 grants: 24 tables × three roles × seven projected privileges. PostgreSQL-version differences in reporting MAINTAIN explain why a PGlite `aclexplode` total can differ. There are no independent column-specific grants.

Concrete old-policy exposure remains: `Users can view all profiles`, `Workers viewable by all`, `Businesses viewable by all` and `Jobs viewable by all` have SELECT condition `true` and apply to PUBLIC. Profile/worker/business owners have row-only UPDATE policies with broad table UPDATE privileges; verification and other protected columns have not yet been restricted. Applications still permit direct worker insert/update and poster update, rather than the new transactional workflow RPC. Do not treat the zero current rows as a durable security control.

The public default ACLs for objects created by `postgres` and `supabase_admin` grant broad table/sequence privileges and function EXECUTE to anon/authenticated/service. Public function defaults therefore need to be represented during rehearsal. The pending SQL's explicit revokes must continue to be checked, rather than assuming PostgreSQL's PUBLIC default alone.

| Hosted routine | SECURITY attribute | search_path | anon EXECUTE | authenticated EXECUTE | service EXECUTE |
| --- | --- | --- | --- | --- | --- |
| `handle_new_user()` | DEFINER | public | no | no | yes |
| `has_role(uuid,app_role)` | INVOKER | public | no | yes | yes |
| `update_updated_at_column()` | INVOKER | public | yes | yes | yes |

All are owned by `postgres`. Their bodies exactly match the canonical historical replay after CRLF-to-LF normalization:

| Routine | MD5 of LF body / characters |
| --- | --- |
| `handle_new_user` | `c60a46672efa5c46d5edfe149344d59f` / 589 |
| `has_role` | `dae5cfc5a8d92461a428f6702e4e65af` / 105 |
| `update_updated_at_column` | `301a884953d37769916294bb60562e05` / 52 |

This establishes body parity, not equality of execution privileges. It also means the old signup function still derives the profile role from supplied metadata; the pending replacement restricts role initialization to worker/business and writes trusted role rows. The pending `has_role` becomes a scoped, empty-search-path DEFINER wrapper using private helpers, intentionally replacing the hosted INVOKER implementation.

## Reviewable local adoption context

The isolated directory is:

`C:\Users\ADMIN\Documents\ChatGPT\TAAWUN\deployment\staging\xhogffnpjaoxkgoiwcty`

It has a separate CLI-created `supabase/config.toml` and `supabase/migrations` directory. It is a versioned review context, not a replacement of the canonical repository migrations. The original ignored rehearsal context remains under work/staging-adoption; the preserved files are byte-identical and LF Git attributes keep the hashes reproducible. No project link, credentials or data download was added. The six hosted migrations were materialized from their recorded statements, with LF text and a final newline, preserving their actual July versions and names. Two new filenames were generated with cached Supabase CLI **2.121.0**, using `npx.cmd --no-install supabase migration new`.

The compatibility migration contains exactly:

```sql
-- Candidate-only compatibility for a CV column omitted from the July migration history.
-- Preserves the existing private bucket and its policies. No application rows are updated.
ALTER TABLE public.cv_records ADD COLUMN IF NOT EXISTS file_url text;
```

The second pending file is a **byte-identical copy** of the canonical [security migration](../supabase/migrations/20261015110639_student_marketplace_security.sql). Its adoption filename gives it a new version after the compatibility migration; the canonical file remains unchanged. The established July history remains unchanged. Do not also apply the canonical security filename to this candidate.

| Local migration filename | SHA-256 of saved file bytes |
| --- | --- |
| `20260713113724_20260409085945_9a063031-db23-4f68-b150-7225b62c118f.sql` | `9446b934dfc20c7015784189a498658ff211a35094a405a42c911fc847ebdd8d` |
| `20260713113756_20260503150601_4b372c33-04b6-45e0-9d3e-f571cab86922.sql` | `f6a11273e49d9f5740903001e3d18e50cb5d77fc91c00364e832ad7e47873465` |
| `20260713113803_20260626114800_fix_handle_new_user_role_casing.sql` | `a731f8c87ef1a379dda15f23e854bc489a0f3decf191748f67788ce306f1dae5` |
| `20260713113811_20260627000000_candidate_hunter_backend.sql` | `aff92b2b86d3d523b167a8c4ebd508d21305ebf4fb35a48055cd102c81e6b543` |
| `20260713114015_private_cv_storage.sql` | `97cb5d3930518009e0687ea65bf91296d7da14a8d032590ee2056209305cac42` |
| `20260713114151_restrict_security_definer_functions.sql` | `a331bcc1c413368ab9ab3fd488d678dc1f578532c243274b755752843fd55076` |
| **`20261015130045_staging_cv_file_url_compatibility.sql`** | `c42f6381d615ea97ca290d8aa67db63617e60fecf07b6acafc34d2ad5922e5bc` |
| **`20261015130133_student_marketplace_security_adoption.sql`** | `f11fa56517dfc63ae05f8dd3842a86af0e3ad3ad018973a52b4c14fc4652ab75` |

The compatibility file is 251 bytes; the security copy is 54,594 bytes. These hashes freeze the proposed SQL. Any later source change requires a new review, hash and rehearsal. The six fetched historical files and adoption manifest are now preserved in this versioned review context; do not lose this candidate's history in future canonical CLI runs.

### Local rehearsal actually executed

An empty in-memory PGlite replayed the **actual six hosted history bodies**, then the two pending files in order. It used substitute Auth/Storage schemas and modeled hosted broad public table and function defaults. No hosted SQL write occurred.

All **15 assertions passed**. The six-file replay reproduced 24 tables/249 columns. The resulting schema had 32 tables, 327 columns, 69 policies, 27 routines, 50 indexes and 23 triggers. Its columns, enums, policies, indexes, triggers and constraints exactly matched the canonical six-file final schema. No private-table grants remained for PUBLIC/anon/authenticated; anon table grants were limited to jobs SELECT; `consume_ai_budget_for_user` remained executable only by service. Existing hosted-style explicit service EXECUTE grants on public RPCs were preserved, and those RPCs still enforce caller checks internally.

Evidence is saved locally at `work/staging-adoption/local-rehearsal.json`. This is structural/ACL verification, not a real PostgreSQL 17 transaction, PostgREST, Auth or Storage-service test. The existing regression suite provides separate workflow coverage. The new compatibility file adds a nullable column without row updates; the copied security SQL still performs the documented role backfill, privilege/policy replacement, storage constraints and other non-additive effects in [MIGRATION_IMPACT_REPORT.md](MIGRATION_IMPACT_REPORT.md).

## Ordered next action requiring owner approval

1. Preserve this reviewed schema/history manifest and resolve the backup/containment decision. The backup API still returns no entries/recovery range; recoverability is not established. Active legacy hunters must be accounted for before new traffic or schema rollout. Quarantine, deployment and secret/schedule edits are separate cloud mutations and are not authorized by this read-only review.
2. Approve an **isolated staging adoption dry run** against this candidate, from the exact local context and reviewed hashes. Do not use `--include-all`, `--include-roles`, `--include-seed`, `--yes`, migration repair or reset. The installed CLI help says ordinary `db push` updates Vault from config before migrations; therefore **`--skip-vault` is mandatory even for this dry run**.
3. Run this proposed command only after the required approval:

```powershell
npx.cmd --no-install supabase db push --workdir "C:\Users\ADMIN\Documents\ChatGPT\TAAWUN\deployment\staging\xhogffnpjaoxkgoiwcty" --project-ref xhogffnpjaoxkgoiwcty --dry-run --skip-vault
```

The **only acceptable pending list**, in order, is:

- `20261015130045_staging_cv_file_url_compatibility.sql`
- `20261015130133_student_marketplace_security_adoption.sql`

Stop if a July file, canonical April–June file, original canonical security version, seed, role change, Vault update, repair instruction or any additional migration appears. Stop on any target mismatch, history drift, changed hash, incompatible type or authentication error; do not auto-repair it.

4. Obtain explicit approval to apply exactly those two migrations to `xhogffnpjaoxkgoiwcty`, with the accepted backup/containment limitation and intended staging-only purpose. The apply command is the same reviewed invocation with only `--dry-run` removed:

```powershell
npx.cmd --no-install supabase db push --workdir "C:\Users\ADMIN\Documents\ChatGPT\TAAWUN\deployment\staging\xhogffnpjaoxkgoiwcty" --project-ref xhogffnpjaoxkgoiwcty --skip-vault
```

This is a future proposal, **not executed**. It must append exactly two history entries and preserve the existing six. A failure after the first migration can leave the harmless compatibility column applied; inspect the actual history before retrying. Do not assume two migration files form one transaction or undo failure with history deletion/reset. The enum additions and workflow RPCs require post-commit verification on the actual engine.

5. After an approved application, rerun read-only catalog/history checks and supported advisors. Confirm 30 public + two private tables, the new CV column, correct four enum labels, RLS/ACLs, private storage and exact two new history entries. Separately approve any test-account/fixture writes and hosted workflow tests. Coordinate secured Edge/frontend deployment and controlled synthetic data only within explicit authorization; schema adoption does not itself deploy or validate those services.

CLI semantics were checked against installed help and the [official migration-fetch](https://supabase.com/docs/reference/cli/supabase-migration-fetch) and [db-push reference](https://supabase.com/docs/reference/cli/supabase-db-push). Fetching history creates local files; pushing applies pending versions and updates hosted history. No remote CLI dry run, repair or push was performed during this review.

**Frozen outcome:** the candidate's catalog is compatible with the reviewed two-step adoption bundle, subject to owner approval, current-state recheck, actual PostgreSQL 17 execution/service validation and the backup/legacy-function containment decision. Existing evidence does not authorize any cloud write.
