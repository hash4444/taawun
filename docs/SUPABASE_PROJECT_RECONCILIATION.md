# Supabase project reconciliation and data-safety gate

Checked 2026-10-15 (Asia/Dubai). These are read-only discovery findings, not authorization to resume or change a project.

## Owner instruction

The owner selected `xhogffnpjaoxkgoiwcty` (Taawun) as **provisional staging only**. Both that project and `fvnemfbqpmweqzhzuflu` must be treated as potentially containing important data. The original project must remain untouched. Reactivation, migration, reset, deletion and deployment each remain unauthorized until explicitly approved. Selecting a target did not approve any of those operations.

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
| Taawun | `xhogffnpjaoxkgoiwcty` | `ap-south-1` | INACTIVE | Owner-selected provisional candidate |
| digitec-loyalty | `zerylxncpucnxqprojpv` | `eu-central-1` | INACTIVE | Unrelated; not inspected further |
| Condisc AI | `ieguqcpinqaikbqqtcyf` | `ap-northeast-2` | INACTIVE | Unrelated; not inspected further |

The original `fvnemfbqpmweqzhzuflu` is absent from this list. An initial metadata request returned a permission error. That does not establish whether it exists, was deleted, belongs to another account, or contains production data. No further request was sent to it after the owner's instruction to leave it untouched. Its stored URL/key were not used to probe its services.

## Provisional Taawun candidate: actual inspection

| Check | Actual result | What it proves |
| --- | --- | --- |
| Management project metadata | ID/name above; created `2026-07-13T09:58:15.843377Z`; PostgreSQL `17.6.1.141`; INACTIVE | Identity, recorded creation time/version/region/state only |
| Organization metadata | Free plan | Current reported organization plan; not backup entitlement or resume eligibility |
| Development branch listing | Empty list | No development branches were returned by this connection |
| Deployed Edge Function metadata | `ai-job-hunter` and `candidate-hunter`, both version 1, status ACTIVE, `verify_jwt=false`; no `chat` returned | Prior deployment exists even though the project is inactive; does not prove production usage or safe handler authorization |
| Stored deployed function source | Both check a configured cron secret for `run_all`; legacy per-user paths use service-role access and paid Lovable calls without the new consent/role/quota/availability controls | Current branch security fixes are not deployed; legacy Job Hunter can insert applications automatically, while Candidate Hunter marks outreach without verified delivery |
| Read-only log aggregation | No source/count rows returned for the default last-24-hour window | No evidence in that query/window; not proof of no historical traffic or users |
| Read-only table listing for public/Auth/Storage | Connection timeout | Schema and data could not be inspected while inactive; **not** an empty-database result |
| Existing user/business/job/application counts | Not obtained | Presence and importance of records remain unknown |
| Hosted RLS/grants/migration history/advisors | Not obtained | Repository migrations cannot establish hosted state or drift |
| Prior production vs test use | Not established | Name, inactivity and creation time cannot classify usage |
| Normal CLI authentication | Owner-approved browser verification completed successfully | CLI login works; no credential value was copied into the repository |
| Supported CLI backup inventory | CLI 2.121.0 `backups list --project-ref xhogffnpjaoxkgoiwcty --output-format json` succeeded: `backups=[]`, `physical_backup_data={}`, `pitr_enabled=false`, `walg_enabled=true`, region `ap-south-1` | No backup entries or physical recovery boundaries were returned; PITR is disabled. The WAL-G flag does not prove a completed or restorable backup |
| Paused-project recovery archive / dates | Not established by that inventory | No claim that a retained pause archive exists or is absent; recoverability remains unconfirmed |
| Dashboard inspection | Browser-control runtime failed to initialize | No dashboard recovery information was read; no Resume/Restore action was taken |

No database SQL mutation, account creation, migration, storage write, function deployment, project resume or backup restoration occurred. Once table discovery failed due to connection timeout, repeated database queries were avoided. Function listing and aggregate log inspection use read-only management/analytics access, not database mutation or invocation of a deployed function.

Stored-source inspection was limited to the two candidate-project functions and did not invoke them. Candidate Hunter matches the historical repository source; Job Hunter adds a cron-secret guard to that baseline. See the source hashes and line-level findings in `MIGRATION_IMPACT_REPORT.md`. Actual secret presence, schedules, past paid calls, traffic and automatic applications remain unverified. Do not characterize the deployed cron as unauthenticated, and do not assume updating SQL alone contains service-role legacy handlers. Review and separately authorize containment of existing functions/schedules before a resume that could re-enable their writes/provider calls.

## Recovery options: documented vs verified

Official [backup documentation](https://supabase.com/docs/guides/platform/backups) describes daily backup access for paid plans and recommends off-site exports for Free projects. Database backups exclude Storage file contents. The current Free-plan metadata therefore does not establish that this candidate has a downloadable daily backup, PITR, a recent recovery point or intact CV/KYC files.

The current [project-pausing guide](https://supabase.com/docs/guides/platform/free-project-pausing), rechecked after login, describes a restoration window of up to **one year from the pause date**. This supersedes the older 90-day wording initially retrieved during preparation; older examples elsewhere may still show that number. Supabase also documents a possible [Dashboard backup download and local restore](https://supabase.com/docs/guides/local-development/restoring-downloaded-backup). The candidate's actual pause date, retention and offered recovery actions were not returned by the CLI inventory. Its July creation date cannot be substituted for the pause date or project-specific eligibility. No recovery availability is asserted for this individual project.

The connected Supabase tools do not expose the [Management API backup-list endpoint](https://supabase.com/docs/reference/api/v1-list-all-backups), so the installed CLI's supported command was used. The initial attempt required authentication. After the owner authorized normal CLI sign-in and supplied its browser verification code, the authenticated read succeeded with the values recorded above. No token was extracted or repurposed, no backup was downloaded, and the project was rechecked as INACTIVE. No paid plan, PITR or other add-on was activated.

The API documentation does not define this empty response as proof that every paused-project archive is absent. Dashboard Project Overview/backup recovery notices or Supabase confirmation are still needed to determine whether a retained archive exists, its dates and whether it includes a usable recovery path. The successful API read proves connectivity and the returned inventory only.

## Staging suitability decision

**Not established; NO-GO for writes.** Treat the candidate as data-bearing until an inventory and recovery evidence demonstrate otherwise. Do not replay repository history against an unknown hosted schema. The pending migration changes privileges/policies, backfills roles and changes existing Storage behavior; see `MIGRATION_IMPACT_REPORT.md`.

Required evidence before declaring it safe:

1. Owner dashboard check: pause date, offered resume/download path, available backup dates/type/status and any independent prior export. Inspect metadata only; do not click Resume, Restore, Delete, Reset or upgrade a plan under the current authorization.
2. Establish recoverability: preserve an existing database backup and Storage files, verify integrity and rehearse restore in an isolated environment with outbound integrations disabled. Keep real personal data outside Git, browser reports and public artifacts.
3. Inspect either that isolated copy or, after **separate approval**, the resumed candidate using a read-only session. Obtain schema/migration/grant/policy catalogs, aggregate row counts and non-identifying usage dates. Check Auth users, profiles, businesses, jobs, applications, CV/KYC metadata, notifications and financial/attendance history. No table samples, emails, names, tokens or document contents are needed for the first inventory.
4. Inspect configured webhooks, scheduled jobs, deployed functions, Auth domains/providers, prior deployments and operational ownership before classifying former production/test usage. Aggregate dates alone are insufficient proof. Resuming an existing project may resume existing activity; this is one reason it is a separate gate.
5. If important/production data exists or usage remains uncertain, preserve this project and propose a separately approved isolated staging environment using synthetic data. Do not sanitize, overwrite or reset the candidate in place.
6. Compare the actual schema and migration history with the impact report. Resolve drift/orphans/invalid legacy constraints in a reviewed plan. Request a separate migration approval only after that review and recovery verification.

Next authorization should cover a narrow inspection/recovery step, not migrations or deployment. All live integration tests remain blocked until both the environment's safety and the permitted staging operations are confirmed.
