import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateRunId(value) {
  if (typeof value !== 'string' || !/^taawun-staging-[a-z0-9-]{6,60}$/.test(value)) throw new Error('Run ID must start taawun-staging- and contain only lowercase letters, digits and hyphens.');
  return value;
}
export function buildFixtures(runId, now = new Date()) {
  validateRunId(runId);
  if (!Number.isFinite(+now)) throw new Error('Invalid fixture date.');
  const day = new Date(now); day.setUTCDate(day.getUTCDate() + 14); day.setUTCHours(6, 0, 0, 0); // 10:00 Asia/Dubai.
  const iso = offsetMinutes => new Date(+day + offsetMinutes * 60000).toISOString();
  const marker = `[STAGING ${runId}]`;
  const actors = ['studentA', 'studentB', 'employerA', 'employerB', 'trustedAdmin'].map(alias => ({
    alias, initialRole: alias.startsWith('employer') ? 'business' : 'worker',
    privilegedRole: alias === 'trustedAdmin' ? 'admin: trusted operator must grant separately after approval' : null,
    name: `${marker} ${alias}`, emailPlaceholder: `${alias.toLowerCase()}-${runId}@example.invalid`,
    id: null, emailConfirmed: false,
  }));
  const shared = { title: `${marker} monthly internship`, description: 'Synthetic staging opportunity. Not a real vacancy.', poster_id: '{{employerA.id}}', business_id: '{{employerA.id}}', poster_role: 'business', country: 'AE', currency: 'AED', location: 'Dubai', address: 'Synthetic staging location', student_friendly: true, skills_required: ['Excel'], experience_years: 0, slots_total: 1, slots_filled: 0, remote_allowed: false, job_type: 'internship', employment_type: 'temporary', payment_model: 'monthly', pay_amount: 2500, salary_min: 2500, salary_max: 3000, start_time: iso(0), end_time: iso(60 * 24 * 60), deadline: iso(7 * 24 * 60), schedule_kind: 'flexible', status: 'open' };
  const initialStudent = { user_id: '{{studentA.id}}', university: 'Synthetic Test University', degree: 'Test field of study', graduation_year: now.getUTCFullYear() + 1, academic_status: 'undergraduate', city: 'Dubai', skills: ['Excel'], preferred_job_types: ['internship', 'part_time', 'shift'], preferred_hours: '09:00–18:00 UAE time', work_eligibility: 'needs_confirmation', eligibility_confirmed: false, adult_consent_at: null, consent_to_matching: false, onboarding_completed_at: null };
  const preferences = { user_id: '{{studentA.id}}', timezone: 'Asia/Dubai', weekly_windows: Array.from({ length: 7 }, (_, weekday) => ({ weekday, start: '09:00', end: '18:00' })), minimum_shift_minutes: 120, travel_buffer_minutes: 30, share_with_employers: false };
  const icsDate = value => value.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TAAWUN//Synthetic Staging Fixture//EN','BEGIN:VEVENT',`UID:${runId}-lecture`,`DTSTART:${icsDate(iso(240))}`,`DTEND:${icsDate(iso(300))}`,'SUMMARY:SYNTHETIC CLASS TITLE MUST NOT BE STORED','DESCRIPTION:FAKE PRIVATE NOTE MUST NOT LEAVE THE BROWSER','END:VEVENT','END:VCALENDAR',''].join('\r\n');
  return {
    manifest: { version: 1, kind: 'synthetic-staging-only', runId, generatedAt: now.toISOString(), networkExecuted: false, target: null, actors, warnings: ['No accounts or records were created.', 'Replace .invalid addresses only with operator-controlled test inboxes after written staging approval.', 'Never treat placeholder actor IDs or this manifest as authorization to seed a remote target.'] },
    fixtures: {
      marker, bindingsRequired: actors.map(a => `${a.alias}.id`), initialStudent,
      completeStudentPatch: { eligibility_confirmed: true, adult_consent_at: '{{execution_timestamp}}', consent_to_matching: true, onboarding_completed_at: '{{execution_timestamp}}' },
      availability: preferences,
      jobs: {
        flexible: shared,
        fixedCompatible: { ...shared, title: `${marker} compatible shift`, job_type: 'shift', payment_model: 'hourly', pay_amount: 45, salary_min: null, salary_max: null, deadline: iso(-24 * 60), start_time: iso(0), end_time: iso(120), schedule_kind: 'fixed' },
        fixedConflict: { ...shared, title: `${marker} conflicting shift`, job_type: 'shift', payment_model: 'hourly', pay_amount: 45, salary_min: null, salary_max: null, deadline: iso(-24 * 60), start_time: iso(240), end_time: iso(360), schedule_kind: 'fixed' },
      },
      importedBusyPeriods: [{ external_uid: `${runId}-lecture`, start_at: iso(240), end_at: iso(300), busy: true }],
      agentSettings: { user_id: '{{studentA.id}}', mode: 'APPROVAL', paused: false, auto_apply_enabled: false, require_user_approval: true, minimum_match_score: 80, daily_application_limit: 1, excluded_companies: [], excluded_keywords: [] },
      notes: ['Payload templates only: IDs and execution-time consent must be bound after fresh-account verification.', 'Create extra copies of marked jobs for independent rejection, capacity, expiry and quota cases. Do not reuse a completed application for another scenario.', 'Never seed approved verification flags directly; exercise document review and final review with the trusted admin.'],
    },
    ics,
  };
}
export async function prepareFixtures(runId, cwd = process.cwd()) {
  const built = buildFixtures(runId);
  const directory = resolve(cwd, 'work', 'staging', validateRunId(runId));
  await mkdir(resolve(cwd, 'work', 'staging'), { recursive: true });
  await mkdir(directory); // Refuse to overwrite an existing run/evidence directory.
  await writeFile(resolve(directory, 'manifest.json'), JSON.stringify(built.manifest, null, 2) + '\n', { flag: 'wx' });
  await writeFile(resolve(directory, 'fixtures.json'), JSON.stringify(built.fixtures, null, 2) + '\n', { flag: 'wx' });
  await writeFile(resolve(directory, 'academic-timetable.ics'), built.ics, { flag: 'wx' });
  return directory;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === '--run-id')) throw new Error('Usage: node scripts/staging/prepare.mjs [--run-id taawun-staging-UNIQUE-ID]');
  const runId = args[1] || `taawun-staging-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${randomUUID().slice(0, 8)}`;
  const directory = await prepareFixtures(runId);
  process.stdout.write(`Offline fixtures prepared: ${directory}\nNo network requests, accounts or database changes were made.\n`);
}
