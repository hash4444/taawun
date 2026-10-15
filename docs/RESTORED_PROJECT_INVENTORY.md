# Restored Taawun project: read-only inventory

Inspected 2026-10-15 (Asia/Dubai), after the owner reported restoring the provisional candidate. This report covers `xhogffnpjaoxkgoiwcty` only. The agent did not restore the project and has not run a migration, reset, deployment, test signup or data mutation. The original `fvnemfbqpmweqzhzuflu` received no requests during this inspection.

## Verified current state

Management metadata reports **ACTIVE_HEALTHY**, region `ap-south-1`, PostgreSQL `17.6.1.141`. Database queries used explicit READ ONLY transactions and local statement timeouts; results were limited to schema catalogs, operational metadata and aggregates. Names, emails, document contents, tokens, signed URLs and personal record samples were not collected.

| Resource | Exact current count |
| --- | ---: |
| Auth users | 0 |
| Auth audit entries, sessions, identities and MFA factors | 0 each |
| Profiles, workers, businesses and trusted role records | 0 each |
| Jobs and applications | 0 each |
| CV records and verification documents | 0 each |
| Attendance, wallet ledger, bank accounts, disputes and ratings | 0 each |
| Chat sessions and administrative actions | 0 each |
| Job preferences, student agent settings, matches, drafts and logs | 0 each |
| Employer hunter settings, matches, outreach drafts and logs | 0 each |
| Storage object metadata across all three private buckets | 0 |

All **24 existing public application tables** were counted exactly; none contained rows at inspection time. Auth creation/sign-in/audit minimum and maximum dates are null because no corresponding records exist. Planner estimates of `-1` were not interpreted as counts; the values above came from actual aggregate queries.

This establishes an empty current application/Auth inventory. It does not prove the project was never used, that no records were previously deleted, that backups retain all history, or that other external systems contain no related data. No existing user, business, application, financial or stored-document record was observed to preserve in the live snapshot.

## Hosted schema and migration drift

The hosted project has 24 public tables with RLS enabled and no current `taawun_private` schema. Its baseline has 249 columns rather than the repository historical baseline's 250: **`cv_records.file_url` is missing**. The hosted migration history records six July versions, including custom private-CV-storage and function-hardening migrations; it does not use the repository's historical migration version identifiers. The new student-marketplace security migration is not applied.

Read `HOSTED_SCHEMA_REVIEW.md` for the exact catalog/history comparison and ordered adoption proposal. Do not run a normal push, replay historical migrations, mark unrelated history reverted, or reset the database to force alignment. The historical private bucket already exists; replaying the old public-bucket migration could conflict or undo intended privacy.

The current live schema does not yet support the implemented student profiles, private availability tables, notification/hiring RPCs and other new fields. Pointing the new frontend at this database before the approved migration/function rollout would not establish a functioning staging app.

## Storage and automatic activity

The private buckets `cv_files`, `kyb_business` and `kyc_worker` contain zero recorded objects. Current bucket configuration has no MIME/size caps. No database cron/webhook infrastructure was found by the operational review, and both hunter settings tables are empty. This does not rule out external callers, external schedules or configured provider credentials.

The two historical deployed hunters still contain service-role and paid-provider paths without the new safeguards; Job Hunter can insert applications under legacy settings. Their cron-secret checks exist. No function was invoked to test these paths. Replace/contain them as part of a separately approved coordinated rollout, before exposing new test accounts. See `HOSTED_OPERATIONS_REVIEW.md` and `MIGRATION_IMPACT_REPORT.md` for scope and source evidence.

## Advisors: actual results

Security advisors returned **zero lints**. This is a static-advisor result, not proof that ownership policies, metadata trust or the legacy handlers are safe. The schema review still identifies broad historical grants and authorization behavior that the pending migration is intended to replace.

Performance advisors returned these grouped findings; no index or policy changes were applied:

| Finding | Level | Count | Remediation reference |
| --- | --- | ---: | --- |
| Unindexed foreign keys | INFO | 21 | [Supabase linter 0001](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys) |
| Per-row Auth calls in RLS | WARN | 74 | [Supabase linter 0003](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan) |
| Unused indexes | INFO | 4 | [Supabase linter 0005](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) |
| Multiple permissive policies | WARN | 40 | [Supabase linter 0006](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) |

Counts are advisor findings, not distinct security vulnerabilities. Do not drop an index merely because it is unused after a restore or in an empty project. Re-run advisors after any approved schema change and assess remaining findings in the real workload.

## Backup and recovery

The authenticated CLI backup listing was repeated after restoration. It still returned `backups=[]`, `physical_backup_data={}`, `pitr_enabled=false`, `walg_enabled=true`. No available backup entry or physical recovery boundary was exposed. This does not independently rule out a retained pause archive, and the enabled WAL-G flag does not establish a usable recovery point. No backup was created, downloaded or restored by the agent.

Because the current application/Auth/Storage inventory is empty, preservation work now chiefly concerns the actual schema, migration history, grants, buckets, deployed source and external configuration. Catalog reports are useful evidence, but are not a verified restorable backup. A schema/history/configuration snapshot and a reviewed recovery procedure belong in the next approved rollout before changing this baseline. Any secret export, backup download or restore remains separately scoped.

## Suitability and next decision

**The project is a reasonable staging candidate based on its empty current inventory, but it is not yet an integrated or launch-ready staging environment.** Previous production/test usage cannot be conclusively attributed. Keep it restricted to synthetic data and do not advertise it as production.

Before writes, the owner must approve the concrete adoption/rollout plan: preserve the actual July history and schema, add the missing CV column through a forward compatibility step, apply the reviewed marketplace security change, and replace the legacy functions with the new authenticated/default-disabled-cost versions. Do not replay the five old repository migrations or repair history blindly. Separate approval is still needed for synthetic accounts/workflow mutations, email/provider configuration, public frontend hosting and any paid service.

No actual student/employer signup, verification, hiring, email, calendar persistence or hosted AI approval test has been executed. Those remain **NOT RUN** until the appropriate staging write scope is explicitly approved.
