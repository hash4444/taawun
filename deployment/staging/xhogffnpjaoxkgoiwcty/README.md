# Taawun staging adoption context — review only

Target: `xhogffnpjaoxkgoiwcty` only. This directory is not automatically used by the main application's Supabase commands or CI. It contains no project link, credentials, application records or deployment authorization.

The six July SQL files reproduce the migrations already recorded on the restored candidate. They were retrieved as schema/history metadata and compared with the repository baseline. Do not replay or mark them reverted. The only proposed pending files, in order, are:

1. `20261015130045_staging_cv_file_url_compatibility.sql`: adds the missing nullable CV file column while preserving the existing private bucket.
2. `20261015130133_student_marketplace_security_adoption.sql`: byte-identical to the canonical marketplace security migration, assigned a candidate adoption version after the compatibility step.

`reviewed-migrations.json` records exact SHA-256 hashes and distinguishes existing history from proposed files. Git attributes preserve LF bytes so those hashes remain reproducible. Canonical repository migrations are unchanged; do not also apply the original canonical security version to this candidate.

Historical SQL retains its inherited whitespace to preserve the reviewed file hashes; it was not cosmetically reformatted. New pending SQL and proposal files are checked separately for whitespace errors.

Read [the hosted schema review](../../../../docs/HOSTED_SCHEMA_REVIEW.md), [restored inventory](../../../../docs/RESTORED_PROJECT_INVENTORY.md) and [migration impact](../../../../docs/MIGRATION_IMPACT_REPORT.md) before considering a live operation. Local PGlite replay of all eight files passed 15 structural/ACL assertions; this does not prove actual PostgreSQL 17 or Supabase service behavior.

After explicit owner approval, the reviewed dry-run invocation from the repository root is:

```powershell
npx.cmd --no-install supabase db push --workdir deployment/staging/xhogffnpjaoxkgoiwcty --project-ref xhogffnpjaoxkgoiwcty --dry-run --skip-vault
```

Stop on any extra pending migration, history-repair request, changed hash, new data, incompatible schema or target mismatch. Do not use reset, migration repair, include-all, seed, role or Vault updates to force the run through. Applying the two files needs explicit approval; an approved dry run alone does not authorize application. Function deployment and synthetic workflow/account creation are additional write scopes.
