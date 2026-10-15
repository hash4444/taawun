# Hosted operations review

Inspected 2026-10-15, approximately 12:50–12:57UTC (16:50–16:57 Asia/Dubai). Target: `xhogffnpjaoxkgoiwcty` only. **Read-only investigation complete; no writes or function/provider calls were performed.** The owner restored the candidate themselves; the root task subsequently verified `ACTIVE_HEALTHY`. Restoration is an observed current state, not a request to reactivate it again or permission to change its data.

The candidate currently appears empty from exact aggregate inventories, but legacy deployed hunters remain reachable operational components. Before executing them, seeding data or deploying this release, obtain separate approval for the write scope and a reviewed recovery/preservation and outbound-containment decision. Current emptiness does not establish historical non-use or recoverability.

## Scope and evidence

This review used four successful read-only SQL queries: catalog discovery; storage configuration and aggregate object counts; hunter settings column discovery; and aggregate hunter settings counts. Queries used `pg_extension`, catalog relations, `information_schema.columns`, safe bucket configuration columns and `count(*)`/aggregate timestamps. No application records, Auth identities, filenames/object paths, file bytes, signed URLs, function bodies, trigger arguments, schedule commands, webhook headers/bodies/URLs, secret values or Vault contents were returned. The original project `fvnemfbqpmweqzhzuflu` was not contacted.

Project health, full application/Auth inventory and backup inventory below are cross-references to separate root-task read-only checks, not additional reads of those records by this review. No attribution to a particular developer, customer or prior operator is possible from these metadata findings.

## Storage configuration and aggregate inventory

| Bucket | Visibility/type | Object metadata rows | Bucket-specific size/MIME limits | Versioning / lifecycle |
| --- | --- | --- | --- | --- |
| `cv_files` | Private / STANDARD | 0 | Both null | DISABLED / no lifecycle configuration |
| `kyb_business` | Private / STANDARD | 0 | Both null | DISABLED / no lifecycle configuration |
| `kyc_worker` | Private / STANDARD | 0 | Both null | DISABLED / no lifecycle configuration |

The exact total from `storage.objects` was 0, and the count referencing a nonexistent bucket was 0. First/last object creation aggregates were null for every bucket. The bucket metadata records were created on 2026-07-13; those dates establish metadata creation only. No file or object content was opened or downloaded.

Important limits:

- These buckets are **already private** in the inspected hosted state. Do not claim this branch made them private or infer that its new migration has run.
- Null `file_size_limit` and `allowed_mime_types` mean no explicit per-bucket restriction was recorded, not unlimited platform capacity or permission to upload arbitrary content. The pending release proposes explicit 15,728,640 byte limits and MIME restrictions; they have not been applied by this review.
- Zero database object rows do not independently verify physical object-store integrity, prove there are no untracked/orphaned bytes, establish a deletion history or supply a Storage backup. No file-list/download or signed-URL probe was performed.
- Versioning disabled and lifecycle configuration absent are metadata facts, not proof of historical retention/deletion behavior. Recovery and retention decisions remain separate.

## Installed extensions

| Extension | Version | Schema |
| --- | --- | --- |
| `pg_stat_statements` |1.11| `extensions` |
| `pgcrypto` |1.3| `extensions` |
| `plpgsql` |1.0| `pg_catalog` |
| `supabase_vault` |0.3.1| `vault` |
| `uuid-ossp` |1.1| `extensions` |

No installed `pg_cron`, `pg_net` or `http` extension was returned. Vault being installed does not prove credentials exist; none were inspected. Query statistics were not read because their statement text could contain sensitive material and is unnecessary for this inventory.

## Scheduling and webhook catalog

| Check | Observed result | Practical meaning |
| --- | --- | --- |
| Schemas `cron`, `net`, `supabase_functions` | None present | No corresponding in-database infrastructure visible in this database snapshot |
| `cron.job` relation | Absent | No pg_cron schedule metadata could be enumerated; no command text was queried |
| `supabase_functions.hooks` relation | Absent | No hook tracking relation under that standard schema |
| `net.http_request_queue` relation | Absent | No pg_net request queue to inspect or execute |
| Noninternal triggers whose function/schema/trigger name identifies HTTP/webhook integration | None | No named database webhook path found, including disabled triggers in this name-based check |
| HTTP/webhook-named functions or functions under `cron`/`net`/`http`/`supabase_functions` | None | No matching function catalog entries |
| Enabled custom Auth/public triggers | 19 | Auth signup `on_auth_user_created` calls `public.handle_new_user`; 18 public timestamp triggers call `public.update_updated_at_column` |
| Other enabled noninternal platform triggers | Realtime filter check and Storage integrity/timestamp triggers | Platform maintenance names; no outbound endpoint contents inspected |

These results do not identify an in-database scheduler/webhook that would automatically call a hunter after restoration. They are **not a global guarantee of no automatic activity**. External cron services, old websites/clients, CI systems, other infrastructure or a caller retaining valid credentials can operate without these schemas/extensions. Name-based catalog review alone cannot prove arbitrary routine internals. The separate schema review completed an exact comparison of the three hosted public routine body digests against historical repository code replayed in local PGlite, after CRLF-to-LF normalization, without returning hosted bodies or trigger arguments. The signup and timestamp routine bodies match that baseline, supporting no added custom external behavior in those two application/Auth trigger paths; this does not generalize to unreviewed nonpublic routines. No schedule was created, changed, disabled or run.

The verified public routine source MD5s are `handle_new_user`: `c60a46672efa5c46d5edfe149344d59f` (589 characters); `update_updated_at_column`: `301a884953d37769916294bb60562e05` (52); and `has_role`: `dae5cfc5a8d92461a428f6702e4e65af` (105). Exact body parity is separate from security attributes: hosted `has_role` is now invoker with restricted execution, as documented in the schema review.

## Stored hunter settings and deployed code risk

The settings schema was discovered first. Aggregate reads then returned:

| Aggregate | Job Hunter | Candidate Hunter |
| --- | --- | --- |
| Settings rows | 0 |0|
| Automatic mode enabled | 0 |0|
| Automatic mode without per-application approval | 0 |0|
| Settings with a recorded `last_run_at` | 0 |0|

For Job Hunter, automatic-without-approval means `auto_apply_enabled=true AND require_user_approval=false`. For Candidate Hunter the counted automatic mode is `mode='AUTO'`; the latter is the legacy outreach mode, not proof that a message was delivered. No account IDs, preference text or run timestamps were returned. Zero current settings means no stored row currently selects either automatic behavior; it does not disable an endpoint or prove the feature was never used.

Earlier authorized management-plane review found two deployed version 1 hunters, both ACTIVE with `verify_jwt=false`, and retrieved their stored source without invoking them. The source evidence and hashes are in [MIGRATION_IMPACT_REPORT.md](MIGRATION_IMPACT_REPORT.md#verified-handler-behavior-and-resumption-risks):

- Both actual deployments check a configured cron secret for `run_all`. Per-user actions check a Supabase user. It would be incorrect to call their cron unauthenticated solely from the deployment flag.
- The legacy handlers use service-role database access and Lovable gateway calls. If working provider credentials and suitable inputs exist, calls could spend money or send profile/CV facts to that provider. This review does not read credentials, billing state or secret presence, so it cannot prove that a live paid call would succeed.
- Legacy Job Hunter can insert applications directly under old automatic settings; it does not use the new transactional approval/eligibility/calendar/quota workflow. Candidate Hunter can mark outreach as sent without verified delivery. New stored settings/users/jobs or external invocations could therefore change the present risk even though current settings are empty.
- The secured shared runtime on this branch has **not been deployed** by this investigation. Its paid-provider and cron flags cannot be assumed to control the old deployments. SQL-only changes would not replace service-role Edge code.

Do not invoke old hunters as a health check. Before test execution or migration/deployment, the owner must approve an ordered plan for existing endpoints/external callers and outbound-provider containment. That may involve separately reviewed endpoint, secret, scheduler or deployment changes; none is performed or implied here. Do not disable/delete a legacy component merely to make an inventory look clean.

## Combined current-state assessment

Root's separate exact inventory found 0 Auth users and 0 rows in all 24 public application tables, with null latest-use aggregates. Combined with the three empty bucket metadata counts and empty hunter settings above, this supports describing the candidate as **currently empty and a possible staging target after separate approval**. It does not justify describing it as historically unused, disposable, attributable to a particular person, or a verified clone of the repository.

Root's post-restore supported backup inventory still returned `backups=[]`, `physical_backup_data={}`, `pitr_enabled=false` and `walg_enabled=true`. No listed recovery point was demonstrated; a WAL-G flag alone is not a restore guarantee. The present read-only inspection is not a snapshot/export or restore rehearsal. See [project reconciliation](SUPABASE_PROJECT_RECONCILIATION.md) and [staging readiness](STAGING_READINESS_REPORT.md) for the authoritative combined inventory and recovery gate.

No current object rows or automatic settings identify an immediate stored workload, and no database cron/webhook path was found. The remaining pre-execution risks are legacy outbound-capable endpoints, unknown external callers, unverified recovery, unknown historical use and hosted/repository drift. Existing database grants, signup trigger and service-role paths must be reconciled before exposing a staging frontend or creating test accounts; a functioning health status does not resolve them.

## Next permitted decision

1. Preserve this read-only evidence and the root schema/inventory/advisor findings. Resolve the recovery/preservation decision for this currently empty state; document what can and cannot be restored. Do not assume backup creation/download is included in read-only metadata approval.
2. Review legacy endpoint/external-caller containment and the hosted migration diff. Obtain distinct owner approval for any secret change, function replacement, DDL/migration, fixture write or deployment. No new restoration/reactivation request is needed: the owner has already restored the candidate.
3. Only after those decisions, request approval for the specific staging migration/deployment and synthetic-account test scope in [STAGING_INTEGRATION_PLAN.md](STAGING_INTEGRATION_PLAN.md). Keep paid/provider/cron paths disabled under the approved replacement configuration and verify the actual deployed result before exercising tests.

No SQL mutation, DDL, migration, reset, account creation, storage write/deletion/download, secret read, function invocation, cron execution, provider call, cloud deployment or original-project request occurred in this operations review. No commit was created.
