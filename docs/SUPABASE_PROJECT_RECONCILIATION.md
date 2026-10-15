# Supabase project reconciliation and data-safety gate

Checked 2026-10-15 (Asia/Dubai). These are read-only discovery findings, not authorization to resume or change a project.

## Owner instruction

The owner selected `xhogffnpjaoxkgoiwcty` (Taawun) as **provisional staging only**. Both that project and `fvnemfbqpmweqzhzuflu` must be treated as potentially containing important data. The original project must remain untouched. Reactivation, migration, reset, deletion and deployment each remain unauthorized until explicitly approved. Selecting a target did not approve any of those operations.

**Post-restoration update:** the owner subsequently reported restoring the candidate. Read-only verification now reports **ACTIVE_HEALTHY**. Exact counts found zero Auth users, zero Auth audit/session/identity/MFA records, zero rows in every one of the 24 public application tables and zero Storage object metadata rows. This replaces the earlier inability to inspect the database; it does not authorize migrations, deployments or test-data writes. See `RESTORED_PROJECT_INVENTORY.md`, `HOSTED_SCHEMA_REVIEW.md` and `HOSTED_OPERATIONS_REVIEW.md` for current evidence. Earlier inactive checks below are retained as history where labeled.

## Reference inventory

| Location / source | Reference | Meaning |
| --- | --- | --- |
| Original `origin/main:.env` | `fvnemfbqpmweqzhzuflu`, its HTTPS Supabase URL | Historical frontend project; no proof of environment purpose |
| Ignored local `.env` retained from original checkout | Same original project | Stale local configuration; not committed on the development branch |
| Ignored `.env.local` | Blank URL/public-key overrides | Prevents local development from silently contacting the historical project |
| Current `.env.example` | Blank URL/public key | Requires intentional configuration; contains no credentials |
| `supabase/config.toml` | `taawun-local` | Local CLI identifier, not a cloud project reference |
| `supabase/.temp/project-ref` | Absent | No local CLI cloud-link artifact found |
| Current application client | Environment values with unconfigured loopback fallback | No embedded cloud project URL |
| Current deployment documentation | Both cloud IDs | Historical discrepancy and explicit authorization gate |
| Playwright | Loopback fixture endpoint | Isolated tests; no cloud project |

The inventory inspected configuration values for project identifiers only; no secret values were printed or copied into this report. Removing `.env` from tracking does not remove it from existing Git history. No service-role credential is required or suitable for browser configuration.

## Connected account projects

The connected organization reports the Free plan. Management metadata lists:

| Project | ID | Region | Reported state | Relationship to TAAWUN |
| --- | --- | --- | --- | --- |
| Taawun | `xhogffnpjaoxkgoiwcty` | `ap-south-1` | ACTIVE_HEALTHY after owner restoration | Owner-selected provisional candidate; current inventory empty |
| digitec-loyalty | `zerylxncpucnxqprojpv` | `eu-central-1` | INACTIVE | Unrelated; not inspected further |
| Condisc AI | `ieguqcpinqaikbqqtcyf` | `ap-northeast-2` | INACTIVE | Unrelated; not inspected further |

The original `fvnemfbqpmweqzhzuflu` is absent from this list. An initial metadata request returned a permission error. That does not establish whether it exists, was deleted, belongs to another account, or contains production data. No further request was sent to it after the owner's instruction to leave it untouched. Its stored URL/key were not used to probe its services.

## Provisional Taawun candidate: actual inspection

| Check | Actual result | What it proves |
| --- | --- | --- |
| Management project metadata | ID/name above; created `2026-07-13T09:58:15.843377Z`; PostgreSQL `17.6.1.141`; now ACTIVE_HEALTHY | Owner restoration verified; state alone does not establish data safety |
| Organization metadata | Free plan | Current reported organization plan; not backup entitlement or resume eligibility |
| Development branch listing | Empty list | No development branches were returned by this connection |
| Deployed Edge Function metadata | `ai-job-hunter` and `candidate-hunter`, both version 1, status ACTIVE, `verify_jwt=false`; no `chat` returned | Prior deployment exists even though the project is inactive; does not prove production usage or safe handler authorization |
| Stored deployed function source | Both check a configured cron secret for `run_all`; legacy per-user paths use service-role access and paid Lovable calls without the new consent/role/quota/availability controls | Current branch security fixes are not deployed; legacy Job Hunter can insert applications automatically, while Candidate Hunter marks outreach without verified delivery |
| Read-only log aggregation | No source/count rows returned for the default last-24-hour window | No evidence in that query/window; not proof of no historical traffic or users |
| Read-only database access | Initial table listing timed out while inactive; catalog/aggregate queries succeeded after owner restoration | Current database inspection is available; initial timeout was not an empty-database result |
| Existing user/business/job/application counts | Auth users and all 24 public tables contain exactly 0 rows; three private buckets contain 0 object metadata rows | No current application/Auth/document records observed; historical use or untracked physical bytes are not established |
| Hosted RLS/grants/migration history/advisors | 24 public tables with RLS; 249 columns; six differently versioned July migrations; CV `file_url` missing; security advisors returned no lints, performance findings recorded | Exact schema drift and legacy authorization require the reviewed adoption plan; advisor silence is not a security guarantee |
| Prior production vs test use | Not established | Name, inactivity and creation time cannot classify usage |
| Normal CLI authentication | Owner-approved browser verification completed successfully | CLI login works; no credential value was copied into the repository |
| Supported CLI backup inventory | CLI 2.121.0 `backups list --project-ref xhogffnpjaoxkgoiwcty --output-format json` succeeded: `backups=[]`, `physical_backup_data={}`, `pitr_enabled=false`, `walg_enabled=true`, region `ap-south-1` | No backup entries or physical recovery boundaries were returned; PITR is disabled. The WAL-G flag does not prove a completed or restorable backup |
| Paused-project recovery archive / dates | Not established by that inventory | No claim that a retained pause archive exists or is absent; recoverability remains unconfirmed |
| Dashboard inspection | Browser-control runtime failed to initialize | No dashboard recovery information was read; no Resume/Restore action was taken |

No database SQL mutation, account creation, migration, storage write, function deployment, project resume or backup restoration was performed by the agent. After the owner restored the candidate, database inspection resumed using bounded READ ONLY queries. Function listing and aggregate log inspection used read-only management/analytics access; no deployed function was invoked.

Stored-source inspection was limited to the two candidate-project functions and did not invoke them. Candidate Hunter matches the historical repository source; Job Hunter adds a cron-secret guard to that baseline. See the source hashes and line-level findings in `MIGRATION_IMPACT_REPORT.md`. Actual secret presence, schedules, past paid calls, traffic and automatic applications remain unverified. Do not characterize the deployed cron as unauthenticated, and do not assume updating SQL alone contains service-role legacy handlers. Review and separately authorize containment of existing functions/schedules before a resume that could re-enable their writes/provider calls.

## Recovery options: documented vs verified

Official [backup documentation](https://supabase.com/docs/guides/platform/backups) describes daily backup access for paid plans and recommends off-site exports for Free projects. Database backups exclude Storage file contents. The current Free-plan metadata therefore does not establish that this candidate has a downloadable daily backup, PITR, a recent recovery point or intact CV/KYC files.

The current [project-pausing guide](https://supabase.com/docs/guides/platform/free-project-pausing), rechecked after login, describes a restoration window of up to **one year from the pause date**. This supersedes the older 90-day wording initially retrieved during preparation; older examples elsewhere may still show that number. Supabase also documents a possible [Dashboard backup download and local restore](https://supabase.com/docs/guides/local-development/restoring-downloaded-backup). The candidate's actual pause date, retention and offered recovery actions were not returned by the CLI inventory. Its July creation date cannot be substituted for the pause date or project-specific eligibility. No recovery availability is asserted for this individual project.

The connected Supabase tools do not expose the [Management API backup-list endpoint](https://supabase.com/docs/reference/api/v1-list-all-backups), so the installed CLI's supported command was used. The initial attempt required authentication. After the owner authorized normal CLI sign-in and supplied its browser verification code, the authenticated read succeeded while the project was inactive. It was repeated after the owner restored the project and returned the same empty inventory/disabled PITR. No token was extracted or repurposed and no backup was downloaded. No paid plan, PITR or other add-on was activated.

The API documentation does not define this empty response as proof that every paused-project archive is absent. Dashboard Project Overview/backup recovery notices or Supabase confirmation are still needed to determine whether a retained archive exists, its dates and whether it includes a usable recovery path. The successful API read proves connectivity and the returned inventory only.

## Staging suitability decision

**Empty current staging candidate established; write approval still pending.** The read-only inventory found no current application/Auth/Storage metadata records. Historical use and recoverability are not proved. Do not replay repository history against the differently versioned hosted history: the missing CV column and existing hardening/private storage require a forward adoption plan. The pending migration changes privileges/policies and Storage behavior; see `HOSTED_SCHEMA_REVIEW.md` and `MIGRATION_IMPACT_REPORT.md`.

Required evidence before declaring it safe:

1. Record the empty current inventory and full hosted schema/history comparison; these read-only checks are complete. Previous production/test use remains unattributed because no historical account/activity records were found.
2. Preserve the actual schema, six July history entries, grants, bucket configuration and deployed source before approved changes. Catalog reports alone are not a verified restorable backup. No backup entry was returned; recovery limitations remain explicit in the approval proposal.
3. Use the reviewed forward adoption plan for the missing CV column and new security migration. Stop if a fresh preflight finds records, unrelated schema changes or migrations outside the approved pending set. Do not delete or reset history to force alignment.
4. Replace/contain the legacy deployed hunters as part of an explicitly approved coordinated rollout. No database cron/webhook infrastructure was found, but external callers and provider credentials remain unknown.
5. Obtain separate explicit authorization for migrations, function deployment and synthetic workflow writes. Keep paid calls and cron disabled, and obtain controlled test inboxes before signup/email tests. Public frontend hosting and paid services remain separate gates.

Next authorization can now address the concrete staging adoption/rollout proposal. All mutating integration tests remain blocked until the owner explicitly approves the target and permitted operations. Restoration alone did not supply that approval.
