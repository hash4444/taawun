/** Read-only staging probes. Imports and default CLI mode never contact a target. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateRunId } from './prepare.mjs';

export function validateStagingEnvironment(environment) {
  const runId = validateRunId(environment.TAAWUN_STAGING_RUN_ID);
  const ref = environment.TAAWUN_STAGING_PROJECT_REF;
  if (typeof ref !== 'string' || !/^[a-z0-9]{20}$/.test(ref)) throw new Error('Set the explicitly approved staging project reference; there is no default.');
  if (environment.TAAWUN_STAGING_APPROVAL !== `READ_ONLY_PREFLIGHT:${ref}:${runId}` || !environment.TAAWUN_STAGING_APPROVAL_REFERENCE?.trim()) throw new Error('Record owner approval, then set the exact read-only preflight confirmation and approval reference. Environment flags are not a substitute for owner authorization.');
  if (environment.TAAWUN_STAGING_DATA_SAFETY !== 'CONFIRMED_STERILE_STAGING' || !environment.TAAWUN_STAGING_DATA_SAFETY_REFERENCE?.trim()) throw new Error('Confirm and document a sterile staging target before probes. Unknown historical data is not a test fixture.');
  if (ref === 'fvnemfbqpmweqzhzuflu') throw new Error('The original project is protected and must remain untouched. Recovery/reconciliation of any other candidate is a separate approved scope.');
  const api = environment.TAAWUN_STAGING_SUPABASE_URL;
  if (api !== `https://${ref}.supabase.co`) throw new Error('Staging Supabase URL must exactly match the approved project reference over HTTPS. Custom domains need separate review.');
  let app;
  try { app = new URL(environment.TAAWUN_STAGING_APP_ORIGIN); } catch { throw new Error('Set the exact approved HTTPS staging frontend origin.'); }
  if (app.protocol !== 'https:' || app.username || app.password || app.pathname !== '/' || app.search || app.hash || app.hostname === 'localhost' || app.hostname.endsWith('.localhost')) throw new Error('Use only an approved HTTPS frontend origin, without credentials, path, query or fragment.');
  const key = environment.TAAWUN_STAGING_PUBLISHABLE_KEY || '';
  if (key.startsWith('sb_secret_') || /[\r\n]/.test(key)) throw new Error('Use a public publishable/anon key only; privileged keys are rejected.');
  if (!key.startsWith('sb_publishable_')) {
    let claims;
    try { claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')); } catch { throw new Error('Use a public publishable or legacy anon key.'); }
    if (claims.role !== 'anon') throw new Error('Privileged or unknown JWT keys are rejected.');
    if (claims.ref && claims.ref !== ref) throw new Error('The legacy anon key belongs to another project.');
  }
  if (key.length < 24) throw new Error('The public API key is incomplete.');
  return { runId, ref, apiOrigin: api, appOrigin: app.origin, key, approvalReference: environment.TAAWUN_STAGING_APPROVAL_REFERENCE.trim(), dataSafetyReference: environment.TAAWUN_STAGING_DATA_SAFETY_REFERENCE.trim() };
}
export const PREFLIGHT_CHECKS = [
  'HTTPS frontend root returns a SPA HTML document',
  'Deep link /worker/explore returns the SPA shell',
  'Missing JavaScript asset returns 404 rather than SPA HTML',
  'Deployed security headers are present on HTML',
  'HTML has an explicit revalidation/no-store cache policy',
  'Auth settings endpoint is reachable with the public key',
  'Anonymous open-jobs request with limit=0 returns an empty list',
  'Anonymous student_profiles and user_roles reads are denied',
];
export async function runPreflight(environment, fetcher = fetch) {
  const config = validateStagingEnvironment(environment);
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, passed: !!pass, detail });
  async function get(origin, path, api = false) {
    try {
      const response = await fetcher(`${origin}${path}`, { method: 'GET', headers: api ? { apikey: config.key } : {}, redirect: 'manual', signal: AbortSignal.timeout(10000) });
      return response;
    } catch { return null; } // Do not print raw network diagnostics, URLs with secrets or provider bodies.
  }
  const root = await get(config.appOrigin, '/');
  const rootType = root?.headers.get('Content-Type') || '';
  add('frontend_root', root?.status === 200 && rootType.includes('text/html'), root ? `HTTP ${root.status}; HTML content type ${rootType.includes('text/html')}` : 'Request failed or timed out');
  const deep = await get(config.appOrigin, '/worker/explore');
  add('spa_deep_link', deep?.status === 200 && (deep.headers.get('Content-Type') || '').includes('text/html'), deep ? `HTTP ${deep.status}` : 'Request failed or timed out');
  const missing = await get(config.appOrigin, `/assets/${config.runId}-does-not-exist.js`);
  add('missing_asset', missing?.status === 404, missing ? `HTTP ${missing.status}; must not serve index.html as JavaScript` : 'Request failed or timed out');
  const csp = root?.headers.get('Content-Security-Policy') || '';
  add('security_headers', !!root && root.headers.get('X-Content-Type-Options') === 'nosniff' && !!root.headers.get('Referrer-Policy') && !!root.headers.get('Permissions-Policy') && csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"), 'Requires CSP, nosniff, referrer and permissions policies; inspect their exact host allowlists manually');
  add('html_cache_policy', /no-cache|no-store|must-revalidate/i.test(root?.headers.get('Cache-Control') || ''), 'HTML must revalidate; this does not test hashed asset caching or an older cached release');
  const auth = await get(config.apiOrigin, '/auth/v1/settings', true);
  add('auth_reachable', auth?.status === 200, auth ? `HTTP ${auth.status}; provider settings/content intentionally not logged` : 'Request failed or timed out');
  const jobs = await get(config.apiOrigin, '/rest/v1/jobs?select=id&limit=0', true);
  let emptyJobs = false;
  if (jobs?.status === 200) { try { const body = await jobs.json(); emptyJobs = Array.isArray(body) && body.length === 0; } catch { /* Invalid response is a failed check. */ } }
  add('anonymous_jobs_limit_zero', emptyJobs, jobs ? `HTTP ${jobs.status}; zero-row query only` : 'Request failed or timed out');
  for (const [table, column] of [['student_profiles', 'user_id'], ['user_roles', 'role']]) {
    const response = await get(config.apiOrigin, `/rest/v1/${table}?select=${column}&limit=0`, true);
    add(`anonymous_${table}_denied`, !!response && [401, 403].includes(response.status), response ? `HTTP ${response.status}; expects table-level denial, not a permission to enumerate rows` : 'Request failed or timed out');
  }
  return { version: 1, scope: 'READ_ONLY_PREFLIGHT_ONLY', runId: config.runId, projectRef: config.ref, appOrigin: config.appOrigin, executedAt: new Date().toISOString(), approvalReference: config.approvalReference, dataSafetyReference: config.dataSafetyReference, passed: checks.every(check => check.passed), checks, limitations: ['No account, application, storage, function, email or provider workflow was executed.', 'No migration/deployment/seed/cleanup was performed.', 'A passing preflight does not prove RLS, OAuth, consent, quotas or controlled-launch readiness.'] };
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && args[0] === '--plan')) {
    process.stdout.write(JSON.stringify({ mode: 'OFFLINE_PLAN_ONLY', networkExecuted: false, checks: PREFLIGHT_CHECKS, executeRequirements: ['owner approval of the exact staging target and read-only probe scope', 'offline fixture run prepared first', 'TAAWUN_STAGING_DATA_SAFETY=CONFIRMED_STERILE_STAGING', 'TAAWUN_STAGING_DATA_SAFETY_REFERENCE', 'TAAWUN_STAGING_RUN_ID', 'TAAWUN_STAGING_PROJECT_REF', 'TAAWUN_STAGING_SUPABASE_URL', 'TAAWUN_STAGING_APP_ORIGIN', 'TAAWUN_STAGING_PUBLISHABLE_KEY', 'TAAWUN_STAGING_APPROVAL_REFERENCE', 'TAAWUN_STAGING_APPROVAL=READ_ONLY_PREFLIGHT:<projectRef>:<runId>'] }, null, 2) + '\n');
    return;
  }
  if (args.length !== 1 || args[0] !== '--execute') throw new Error('Usage: node scripts/staging/preflight.mjs [--plan|--execute]');
  const config = validateStagingEnvironment(process.env);
  const directory = resolve(process.cwd(), 'work', 'staging', config.runId);
  const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
  if (manifest.kind !== 'synthetic-staging-only' || manifest.runId !== config.runId || manifest.networkExecuted !== false || manifest.target !== null) throw new Error('Prepare and review a fresh offline fixture manifest before authorizing staging preflight.');
  const reportPath = resolve(directory, 'read-only-preflight.json');
  // Never overwrite existing evidence or start a probe if its output slot already exists.
  const reservation = await import('node:fs/promises').then(fs => fs.open(reportPath, 'wx'));
  try { const report = await runPreflight(process.env); await reservation.writeFile(JSON.stringify(report, null, 2) + '\n'); process.stdout.write(`Read-only preflight ${report.passed ? 'passed' : 'found failures'}; redacted report saved to ${reportPath}\n`); if (!report.passed) process.exitCode = 1; }
  finally { await reservation.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
