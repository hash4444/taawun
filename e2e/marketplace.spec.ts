import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Browser tests exercise the real SPA with an isolated HTTP fixture. They never contact a live Supabase project.
const studentId = '11111111-1111-4111-8111-111111111111';
const employerId = '22222222-2222-4222-8222-222222222222';
const jobId = '33333333-3333-4333-8333-333333333333';
const appId = '44444444-4444-4444-8444-444444444444';
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
type Row = Record<string, unknown>;
type Fixture = { applications: Row[]; events: Row[]; jobs: Row[]; requests: { path: string; body: Row }[]; tables: Record<string, Row[]> };

async function setup(page: Page, options: { role?: 'worker' | 'business'; authenticated?: boolean; complete?: boolean; verified?: boolean; language?: 'en' | 'ar'; theme?: 'light' | 'dark' } = {}): Promise<Fixture> {
  const role = options.role || 'worker', id = role === 'business' ? employerId : studentId;
  const user = { id, aud: 'authenticated', role: 'authenticated', email: `${role}@example.test`, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { role: 'ADMIN', full_name: 'Untrusted metadata' }, created_at: plusDays(-10) };
  const jwt = `e30.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`;
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user };
  const company = { id: employerId, legal_name: 'Campus Studio LLC', trade_name: 'Campus Studio', sector: 'Technology', verification_status: options.verified === false ? 'pending_review' : 'verified', verification_reviewed_at: plusDays(-1), verification_reviewed_by: '55555555-5555-4555-8555-555555555555' };
  const job: Row = { id: jobId, title: 'Student design assistant', company_name: 'Campus Studio', poster_id: employerId, poster_role: 'business', business_id: employerId, businesses: company, job_type: 'part_time', schedule_kind: 'flexible', currency: 'AED', country: 'AE', student_friendly: true, pay_amount: 60, payment_model: 'hourly', address: 'Dubai Knowledge Park', location: 'Dubai', remote_allowed: false, start_time: plusDays(7), end_time: plusDays(60), deadline: plusDays(5), status: 'open', slots_total: 2, slots_filled: 0, skills_required: ['Design'], description: 'Support a creative team around your university studies.', created_at: plusDays(-2), updated_at: plusDays(-1) };
  const student: Row = { user_id: studentId, university: 'University of Dubai', degree: 'Design', graduation_year: 2027, academic_status: 'undergraduate', city: 'Dubai', skills: ['Design'], preferred_job_types: ['part_time'], work_eligibility: 'resident_requires_permit', adult_consent_at: plusDays(-1), eligibility_confirmed: true, consent_to_matching: true, onboarding_completed_at: options.complete === false ? null : plusDays(-1), preferred_hours: 'Evenings' };
  const fixture: Fixture = { applications: [], events: [], jobs: [job], requests: [], tables: {
    profiles: [{ id, full_name: role === 'business' ? 'Employer Owner' : 'Maya Student', email: user.email, role, city: 'Dubai', country: 'AE', account_initialized: true }],
    user_roles: [{ user_id: id, role }], workers: [{ id: studentId, skills: ['Design'], verification_status: 'not_started' }], businesses: [company], student_profiles: role === 'worker' ? [student] : [],
    availability_preferences: [{ user_id: studentId, timezone: 'Asia/Dubai', weekly_windows: [{ weekday: 1, start: '16:00', end: '20:00' }], minimum_shift_minutes: 120, travel_buffer_minutes: 30, share_with_employers: false }], notifications: [], cv_records: [], ai_agent_settings: [], job_preferences: [], ai_job_matches: [], ai_application_drafts: [], ai_agent_logs: [], kyc_documents: [],
  } };
  await page.addInitScript(({ session, authenticated, language, theme }) => {
    if (authenticated) localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
    localStorage.setItem('taawun_language', language);
    localStorage.setItem('taawun_theme', theme);
  }, { session, authenticated: options.authenticated !== false, language: options.language || 'en', theme: options.theme || 'light' });
  await page.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.hostname.endsWith('.supabase.co')) return route.abort(); // Fail closed if configuration regresses.
    if (url.origin !== 'http://127.0.0.1:54321') return route.continue();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': 'content-range', 'content-type': 'application/json' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const body = request.postDataJSON() as Row | null;
    fixture.requests.push({ path: url.pathname, body: body || {} });
    const reply = (data: unknown, status = 200, count?: number) => route.fulfill({ status, headers: { ...headers, ...(count === undefined ? {} : { 'content-range': `0-${Math.max(0, count - 1)}/${count}` }) }, body: JSON.stringify(data) });
    if (url.pathname.endsWith('/token')) return reply(session);
    if (url.pathname.endsWith('/user')) return reply(user);
    if (url.pathname.endsWith('/logout')) return reply({});
    if (url.pathname.endsWith('/signup')) return reply({ id, email: String(body?.email), identities: [], user_metadata: body?.data || {} });
    if (url.pathname.includes('/rpc/')) {
      const rpc = url.pathname.split('/').pop();
      if (rpc === 'get_public_businesses') return reply([{ id: employerId, trade_name: 'Campus Studio', sector: 'Technology', logo_url: null, rating_avg: 0, rating_count: 0 }]);
      if (rpc === 'get_candidate_summaries') return reply([{ user_id: studentId, full_name: 'Maya Student' }]);
      if (rpc === 'submit_application') { fixture.applications.push({ id: appId, job_id: jobId, worker_id: studentId, status: 'applied', created_at: plusDays(0), jobs: job }); return reply(appId); }
      if (rpc === 'update_application_status') { const app = fixture.applications.find(a => a.id === body?.p_application_id); if (app) { app.status = body?.p_status; app.employer_message = body?.p_message; app.interview_at = body?.p_interview_at; } return reply(app || {}); }
      if (rpc === 'replace_calendar_import') { fixture.events = (body?.p_events as Row[] || []).map((e, i) => ({ ...e, id: `event-${i}`, user_id: id, source: 'ics' })); return reply(null); }
      if (rpc === 'disconnect_calendar') { fixture.events = []; return reply(null); }
      return reply(null);
    }
    if (url.pathname.endsWith('/functions/v1/ai-job-hunter')) {
      if (url.searchParams.get('action') === 'run_user') {
        fixture.tables.ai_job_matches = [{ id: 'match-1', user_id: id, job_id: jobId, score: 100, explanation: 'Your recorded Design skill matches this opportunity.', status: 'drafted' }];
        fixture.tables.ai_application_drafts = [{ id: 'draft-1', user_id: id, job_id: jobId, match_id: 'match-1', cover_letter: 'My recorded skills include Design. I would like to discuss this opportunity.', submitted: false }];
        return reply({ scanned: 1, matched: 1, drafted: 1, applied: 0 });
      }
      if (url.searchParams.get('action') === 'apply_draft') { fixture.tables.ai_application_drafts = []; fixture.applications.push({ id: appId, job_id: jobId, worker_id: studentId, status: 'applied', created_at: plusDays(0) }); return reply({ ok: true, application_id: appId }); }
    }
    const table = url.pathname.split('/').pop() || '';
    let rows = table === 'jobs' ? fixture.jobs : table === 'applications' ? fixture.applications : table === 'academic_calendar_events' ? fixture.events : fixture.tables[table] || [];
    if (request.method() === 'POST') {
      const payload = Array.isArray(body) ? body[0] : body || {};
      const created = { id: crypto.randomUUID(), ...payload };
      if (table === 'jobs') { fixture.jobs.push(created); rows = [created]; }
      else if (table === 'academic_calendar_events') { fixture.events.push(created); rows = [created]; }
      else { fixture.tables[table] = [created]; rows = [created]; }
    } else if (request.method() === 'PATCH') {
      rows.forEach(row => Object.assign(row, body));
    } else if (request.method() === 'DELETE') {
      if (table === 'academic_calendar_events') fixture.events = fixture.events.filter(e => `eq.${e.id}` !== url.searchParams.get('id'));
      return reply(null);
    }
    if (url.searchParams.has('id')) rows = rows.filter(row => `eq.${row.id}` === url.searchParams.get('id'));
    if (table === 'jobs' && url.searchParams.has('job_type')) rows = rows.filter(row => `eq.${row.job_type}` === url.searchParams.get('job_type'));
    if (table === 'applications') rows = rows.map(a => ({ ...a, jobs: job, workers: { id: studentId, skills: ['Design'], profiles: { full_name: 'Maya Student', city: 'Dubai' } } }));
    const count = rows.length;
    const object = request.headers().accept?.includes('vnd.pgrst.object+json');
    return reply(object ? rows[0] || null : rows, 200, count);
  });
  return fixture;
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)).toBe(true);
}

test('student and employer registrations preserve account intent and explain email confirmation', async ({ page }) => {
  const fixture = await setup(page, { authenticated: false });
  for (const role of ['worker', 'business']) {
    await page.goto(`/auth/signup?role=${role}`);
    await page.getByLabel('Full Name', { exact: true }).fill('Maya Student');
    await page.getByLabel('Email', { exact: true }).fill(`${role}@example.test`);
    await page.getByLabel(/Phone Number/).fill('+971501234567');
    await page.getByLabel('Password', { exact: true }).fill('Test-password-123');
    await page.getByLabel('Confirm Password', { exact: true }).fill('Test-password-123');
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    const signup = fixture.requests.filter(r => r.path.endsWith('/signup')).at(-1)!;
    expect(signup.body.data).toMatchObject({ role, full_name: 'Maya Student', phone: '+971501234567' });
  }
});

test('login uses trusted roles, rejects cross-role routes, and logout clears the account', async ({ page }) => {
  await setup(page, { authenticated: false });
  await page.goto('/auth/login');
  await page.getByLabel('Email', { exact: true }).fill('worker@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Test-password-123');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/worker\/home/);
  await page.goto('/business/post-job');
  await expect(page).toHaveURL(/\/worker\/home/);
  await page.goto('/worker/profile');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
  await page.goto('/worker/explore');
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('student setup saves progress and completes a real profile submission', async ({ page }) => {
  const fixture = await setup(page, { complete: false });
  await page.goto('/worker/home');
  await expect(page).toHaveURL(/\/worker\/profile\/setup/);
  await page.getByLabel('Degree / field of study').fill('Computer Science');
  await page.getByRole('button', { name: 'Save progress', exact: true }).click();
  await expect(page.getByText('Progress saved', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Save and continue', exact: true }).click();
  await expect(page).toHaveURL(/\/worker\/home/);
  expect(fixture.tables.student_profiles[0].degree).toBe('Computer Science');
  expect(fixture.tables.student_profiles[0].onboarding_completed_at).toBeTruthy();
});

test('student explores, applies once and tracks employer messages and offers', async ({ page }) => {
  const fixture = await setup(page);
  await page.goto('/worker/explore');
  await expect(page.getByText('Student design assistant', { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('student-explore.png'), fullPage: true });
  await page.getByLabel('Opportunity type', { exact: true }).selectOption('internship');
  await expect(page.getByText('No matching opportunities here.', { exact: false })).toBeVisible();
  await page.getByLabel('Opportunity type', { exact: true }).selectOption('part_time');
  await page.getByText('Student design assistant', { exact: true }).click();
  await page.getByRole('button', { name: 'Apply now', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Track application' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply now', exact: true })).toHaveCount(0);
  expect(fixture.requests.filter(r => r.path.endsWith('/submit_application'))).toHaveLength(1);
  fixture.applications[0].status = 'offered'; fixture.applications[0].employer_message = 'Paid role, 60 AED/hour, Tuesday evenings.';
  await page.goto('/worker/applications');
  await expect(page.getByText('Paid role, 60 AED/hour, Tuesday evenings.')).toBeVisible();
  await page.getByRole('button', { name: 'Accept offer', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Offer accepted', { exact: true })).toBeVisible();
  await noOverflow(page);
});

test('verified employer publishes a UAE job and reviews applicants through interview and offer', async ({ page }) => {
  const fixture = await setup(page, { role: 'business' });
  await page.goto('/business/post-job');
  await page.getByLabel('Job title', { exact: true }).fill('Campus marketing intern');
  await page.getByLabel('UAE work location', { exact: true }).selectOption('Dubai');
  await page.getByLabel('Pay (AED)', { exact: true }).fill('70');
  await page.getByLabel('Work starts', { exact: true }).fill(plusDays(14).slice(0, 16));
  await page.getByLabel('Work ends', { exact: true }).fill(plusDays(60).slice(0, 16));
  await page.getByLabel('Working days and hours', { exact: true }).fill('Tuesday and Thursday evenings');
  await page.getByLabel('Responsibilities and learning opportunities', { exact: true }).fill('Learn campaign planning and support the marketing team.');
  await page.getByRole('button', { name: 'Publish opportunity', exact: true }).click();
  await expect(page).toHaveURL(/\/business\/dashboard/);
  expect(fixture.jobs.at(-1)).toMatchObject({ currency: 'AED', country: 'AE', poster_role: 'business', business_id: employerId });
  fixture.applications.push({ id: appId, job_id: jobId, worker_id: studentId, status: 'applied', created_at: plusDays(-1) });
  await page.goto(`/business/job/${jobId}`);
  await page.getByRole('button', { name: 'Shortlist', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm & notify student' }).click();
  await expect(page.getByText('Shortlisted', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Invite to interview', exact: true }).click();
  await page.getByLabel('Interview date and time (UAE)', { exact: true }).fill(plusDays(2).slice(0, 16));
  await page.getByLabel('Message to the student').fill('Meet the team at our Dubai office.');
  await page.getByRole('button', { name: 'Confirm & notify student' }).click();
  await expect(page.getByText('Interview invited', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Send offer', exact: true }).click();
  await page.getByLabel('Message to the student').fill('Offer: 70 AED/hour; Tuesday and Thursday evenings.');
  await page.getByRole('button', { name: 'Confirm & notify student' }).click();
  await expect(page.getByText('Offer received', { exact: true })).toBeVisible();
  await noOverflow(page);
});

test('unverified employers cannot publish and students cannot access employer pages', async ({ page }) => {
  await setup(page, { role: 'business', verified: false });
  await page.goto('/business/post-job');
  await expect(page.getByText('Complete business verification before publishing.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publish opportunity' })).toBeDisabled();
});

test('availability imports private timetable, saves preferences and disconnects without exposing titles', async ({ page }) => {
  const fixture = await setup(page);
  await page.goto('/worker/availability');
  await page.getByLabel('Minimum shift (minutes)', { exact: true }).fill('60');
  await page.getByRole('button', { name: 'Save work preferences' }).click();
  await expect(page.getByText('Work preferences saved', { exact: true })).toBeVisible();
  const start = plusDays(1).replace(/[-:]/g, '').slice(0, 15) + 'Z', end = new Date(Date.parse(plusDays(1)) + 3_600_000).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  await page.getByLabel('Academic calendar file', { exact: true }).setInputFiles({ name: 'semester.ics', mimeType: 'text/calendar', buffer: Buffer.from(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:class-1\r\nDTSTART:${start}\r\nDTEND:${end}\r\nSUMMARY:Private lecture name\r\nEND:VEVENT\r\nEND:VCALENDAR`) });
  await expect(page.getByText('1 private busy periods imported', { exact: true })).toBeVisible();
  expect(fixture.events).toHaveLength(1);
  expect(JSON.stringify(fixture.events)).not.toContain('Private lecture name');
  await page.getByRole('button', { name: 'Disconnect and delete imported timetable' }).click();
  await expect(page.getByText('Imported timetable deleted', { exact: true })).toBeVisible();
  expect(fixture.events).toHaveLength(0);
  await noOverflow(page);
});

test('Arabic student screens use RTL and fit the viewport', async ({ page }) => {
  await setup(page, { language: 'ar' });
  await page.goto('/worker/explore');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'استكشف الفرص', exact: true })).toBeVisible();
  await page.goto('/worker/availability');
  await expect(page.getByRole('heading', { name: 'التوفر الذكي', exact: true })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: test.info().outputPath('availability-arabic.png'), fullPage: true });
});

test('assistant pause is persisted and every prepared application requires approval', async ({ page }) => {
  const fixture = await setup(page);
  await page.goto('/worker/job-hunter');
  await page.getByRole('button', { name: 'Pause assistant now' }).click();
  await expect(page.getByRole('button', { name: 'Find matches' })).toBeDisabled();
  expect(fixture.tables.ai_agent_settings[0].paused).toBe(true);
  await page.getByRole('button', { name: 'Resume assistant' }).click();
  await page.getByRole('tab', { name: 'Settings', exact: true }).click();
  await expect(page.getByLabel('Assistant mode', { exact: true })).toHaveValue('APPROVAL');
  await expect(page.getByLabel('Assistant mode').locator('option[value="AUTO"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Find matches', exact: true }).click();
  expect(fixture.applications).toHaveLength(0);
  await page.getByRole('tab', { name: /Review/ }).click();
  await expect(page.getByText('My recorded skills include Design.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Approve & submit application' }).click();
  await expect(page.getByText('Application submitted with your approval', { exact: true })).toBeVisible();
  expect(fixture.applications).toHaveLength(1);
});

test('core student forms pass automated WCAG AA checks', async ({ page }) => {
  await setup(page);
  for (const path of ['/worker/explore', '/worker/profile/setup', '/worker/availability']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, description: v.description, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  }
});

test('dark theme student forms pass automated WCAG AA checks', async ({ page }) => {
  await setup(page, { theme: 'dark' });
  for (const path of ['/worker/explore', '/worker/profile/setup', '/worker/availability']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  }
});

test('employer posting and applicant forms pass automated WCAG AA checks', async ({ page }) => {
  await setup(page, { role: 'business' });
  for (const path of ['/business/post-job', `/business/job/${jobId}`]) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  }
});
