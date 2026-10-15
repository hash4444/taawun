// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { buildFixtures, prepareFixtures, validateRunId } from '../../scripts/staging/prepare.mjs';
import { runPreflight, validateStagingEnvironment } from '../../scripts/staging/preflight.mjs';
import { parseAcademicCalendar } from '@/lib/calendar';
import { Constants, type Database } from '@/integrations/supabase/types';

const ref = 'abcdefghijklmnopqrst';
const runId = 'taawun-staging-offline-unit';
const env = () => ({
  TAAWUN_STAGING_RUN_ID: runId,
  TAAWUN_STAGING_PROJECT_REF: ref,
  TAAWUN_STAGING_SUPABASE_URL: `https://${ref}.supabase.co`,
  TAAWUN_STAGING_APP_ORIGIN: 'https://staging.example.invalid',
  TAAWUN_STAGING_PUBLISHABLE_KEY: 'sb_publishable_synthetic_test_value_only',
  TAAWUN_STAGING_APPROVAL_REFERENCE: 'synthetic-review-123',
  TAAWUN_STAGING_APPROVAL: `READ_ONLY_PREFLIGHT:${ref}:${runId}`,
  TAAWUN_STAGING_DATA_SAFETY: 'CONFIRMED_STERILE_STAGING',
  TAAWUN_STAGING_DATA_SAFETY_REFERENCE: 'synthetic-sterile-copy-review',
});
const jwt = (claims: object) => `eyJ0eXAiOiJKV1QifQ.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.syntheticSignature`;
const headers = {
  'Content-Type': 'text/html', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=()',
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'; object-src 'none'",
  'Cache-Control': 'no-cache',
};
function mockFetch(overrides: Record<string, () => Response> = {}) {
  return vi.fn(async (input: string, _init?: RequestInit) => {
    const path = new URL(input).pathname;
    if (overrides[path]) return overrides[path]();
    if (path === '/' || path === '/worker/explore') return new Response('<!doctype html><div id="root"></div>', { headers });
    if (path.startsWith('/assets/')) return new Response('', { status: 404 });
    if (path === '/auth/v1/settings') return new Response('{}');
    if (path === '/rest/v1/jobs') return new Response('[]');
    return new Response('{"message":"permission denied"}', { status: 401 });
  });
}

describe('staging harness fails closed before any request', () => {
  it('default CLI mode is offline and ignores unusable target variables', () => {
    const output = execFileSync(process.execPath, ['scripts/staging/preflight.mjs', '--plan'], { cwd: process.cwd(), env: { ...process.env, TAAWUN_STAGING_PROJECT_REF: 'invalid' }, encoding: 'utf8' });
    expect(JSON.parse(output)).toMatchObject({ mode: 'OFFLINE_PLAN_ONLY', networkExecuted: false });
    expect(output).not.toContain(env().TAAWUN_STAGING_PUBLISHABLE_KEY);
  });
  it('requires explicit approval and sterile data references even with an injected fetcher', async () => {
    const fetcher = mockFetch();
    await expect(runPreflight({}, fetcher)).rejects.toThrow();
    await expect(runPreflight({ ...env(), TAAWUN_STAGING_APPROVAL: '' }, fetcher)).rejects.toThrow('owner approval');
    await expect(runPreflight({ ...env(), TAAWUN_STAGING_DATA_SAFETY_REFERENCE: '' }, fetcher)).rejects.toThrow('sterile');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['fvnemfbqpmweqzhzuflu'])('refuses original project %s independently of flags', target => {
    expect(() => validateStagingEnvironment({ ...env(), TAAWUN_STAGING_PROJECT_REF: target, TAAWUN_STAGING_SUPABASE_URL: `https://${target}.supabase.co`, TAAWUN_STAGING_APPROVAL: `READ_ONLY_PREFLIGHT:${target}:${runId}` })).toThrow('original project');
  });
  it('permits validation of the provisional candidate only with complete explicit safety and scope guards', () => {
    const target = 'xhogffnpjaoxkgoiwcty';
    const candidate = { ...env(), TAAWUN_STAGING_PROJECT_REF: target, TAAWUN_STAGING_SUPABASE_URL: `https://${target}.supabase.co`, TAAWUN_STAGING_APPROVAL: `READ_ONLY_PREFLIGHT:${target}:${runId}` };
    expect(() => validateStagingEnvironment({ ...candidate, TAAWUN_STAGING_DATA_SAFETY: '' })).toThrow('sterile');
    expect(validateStagingEnvironment(candidate).ref).toBe(target); // Pure guard validation, never a fetch.
  });
  it('rejects privileged keys, mismatched key claims and mismatched API targets', () => {
    for (const key of ['sb_secret_synthetic_not_allowed', jwt({ role: 'service_role', ref }), jwt({ role: 'anon', ref: 'wrongproject' })]) {
      expect(() => validateStagingEnvironment({ ...env(), TAAWUN_STAGING_PUBLISHABLE_KEY: key })).toThrow();
    }
    expect(() => validateStagingEnvironment({ ...env(), TAAWUN_STAGING_SUPABASE_URL: 'https://different.supabase.co' })).toThrow('exactly match');
    expect(validateStagingEnvironment({ ...env(), TAAWUN_STAGING_PUBLISHABLE_KEY: jwt({ role: 'anon', ref }) }).ref).toBe(ref);
  });
  it.each(['http://staging.example.invalid', 'https://u:p@staging.example.invalid', 'https://staging.example.invalid/path', 'https://staging.example.invalid?token=x', 'https://localhost'])('rejects unsafe frontend origin %s', origin => {
    expect(() => validateStagingEnvironment({ ...env(), TAAWUN_STAGING_APP_ORIGIN: origin })).toThrow();
  });
  it('rejects path traversal run IDs', () => {
    expect(() => validateRunId('../../project')).toThrow();
  });
});

describe('read-only preflight with mocked HTTP only', () => {
  it('uses bounded GETs without redirects, mutation payloads or authenticated user sessions', async () => {
    const fetcher = mockFetch();
    const report = await runPreflight(env(), fetcher);
    expect(report.passed).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(7);
    for (const [url, options] of fetcher.mock.calls) {
      expect(options).toMatchObject({ method: 'GET', redirect: 'manual' });
      expect(options).not.toHaveProperty('body');
      expect(options?.headers).not.toHaveProperty('Authorization');
      if (String(url).includes('/rest/v1/')) expect(new URL(String(url)).searchParams.get('limit')).toBe('0');
    }
    expect(JSON.stringify(report)).not.toContain(env().TAAWUN_STAGING_PUBLISHABLE_KEY);
    expect(JSON.stringify(report)).not.toContain('permission denied');
  });
  it('does not pass on private table exposure, SPA asset fallback or redirect', async () => {
    const fetcher = mockFetch({
      '/rest/v1/student_profiles': () => new Response('[]'),
      [`/assets/${runId}-does-not-exist.js`]: () => new Response('<html>SPA</html>', { headers }),
      '/auth/v1/settings': () => new Response(null, { status: 302, headers: { Location: 'https://other.example.invalid' } }),
    });
    const report = await runPreflight(env(), fetcher);
    expect(report.passed).toBe(false);
    expect(report.checks.filter(check => !check.passed).map(check => check.name)).toEqual(['missing_asset', 'auth_reachable', 'anonymous_student_profiles_denied']);
  });
  it('reports network failure without logging raw diagnostic secrets', async () => {
    const report = await runPreflight(env(), vi.fn(async () => { throw new Error('secret diagnostic token'); }));
    expect(report.passed).toBe(false);
    expect(JSON.stringify(report)).not.toContain('secret diagnostic');
  });
});

describe('offline synthetic fixture generation', () => {
  const now = new Date('2026-10-15T08:00:00Z');
  it('uses separate fresh identities with no credentials, and schema-valid job enum values', () => {
    const { manifest, fixtures } = buildFixtures(runId, now);
    expect(manifest).toMatchObject({ networkExecuted: false, target: null, kind: 'synthetic-staging-only' });
    expect(manifest.actors.map(actor => actor.alias)).toEqual(['studentA', 'studentB', 'employerA', 'employerB', 'trustedAdmin']);
    expect(manifest.actors.every(actor => actor.id === null && actor.emailPlaceholder.endsWith('@example.invalid'))).toBe(true);
    expect(fixtures.initialStudent.adult_consent_at).toBeNull();
    expect(fixtures.initialStudent.eligibility_confirmed).toBe(false);
    for (const job of Object.values(fixtures.jobs) as Array<Database['public']['Tables']['jobs']['Insert']>) {
      expect(Constants.public.Enums.employment_type).toContain(job.employment_type);
      expect(Constants.public.Enums.job_type).toContain(job.job_type);
      expect(Constants.public.Enums.payment_model).toContain(job.payment_model);
      expect(new Date(job.deadline).getTime()).toBeGreaterThan(+now);
      expect(new Date(job.end_time).getTime()).toBeGreaterThan(new Date(job.start_time).getTime());
      expect(job).toMatchObject({ poster_id: '{{employerA.id}}', business_id: '{{employerA.id}}', country: 'AE', currency: 'AED' });
    }
    expect(JSON.stringify(manifest)).not.toMatch(/password|access_token|refresh_token/);
  });
  it('produces a parseable real ICS fixture and strips private content through the existing parser', () => {
    const { ics, fixtures } = buildFixtures(runId, now);
    expect(ics).toContain('\r\nDTSTART:20261029T100000Z\r\n');
    const events = parseAcademicCalendar(ics, { timezone: 'Asia/Dubai', rangeStart: now });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ start_at: fixtures.importedBusyPeriods[0].start_at, end_at: fixtures.importedBusyPeriods[0].end_at, busy: true });
    expect(JSON.stringify(events)).not.toMatch(/SYNTHETIC CLASS TITLE|FAKE PRIVATE NOTE/);
  });
  it('writes only local run files, refuses evidence overwrite and produces valid JSON', async () => {
    const cwd = await mkdtemp(resolve(tmpdir(), 'taawun-offline-staging-'));
    const directory = await prepareFixtures(runId, cwd);
    expect(JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8')).target).toBeNull();
    expect(JSON.parse(await readFile(resolve(directory, 'fixtures.json'), 'utf8')).jobs.flexible.employment_type).toBe('temporary');
    await expect(prepareFixtures(runId, cwd)).rejects.toThrow();
  });
});
