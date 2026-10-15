// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Real embedded PostgreSQL, with minimal Supabase auth/storage fixtures. No remote project or provider.
const db = new PGlite();
const student = '11111111-1111-4111-8111-111111111111';
const student2 = '22222222-2222-4222-8222-222222222222';
const employer = '33333333-3333-4333-8333-333333333333';
const otherEmployer = '44444444-4444-4444-8444-444444444444';
const admin = '55555555-5555-4555-8555-555555555555';
const malicious = '66666666-6666-4666-8666-666666666666';
let job: string;
let application: string;
async function asUser<T>(id: string, action: () => Promise<T>): Promise<T> {
  await db.exec('SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
  try { return await action(); } finally { await db.exec('RESET ROLE'); await db.exec("SELECT set_config('request.jwt.claim.sub','',false)"); }
}
async function sqlAs(id: string, sql: string, params: unknown[] = []) { return asUser(id, () => db.query(sql, params)); }

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1,'/') $$;
    GRANT USAGE ON SCHEMA auth,storage,public TO anon,authenticated,service_role;
    GRANT EXECUTE ON FUNCTION auth.uid(),storage.foldername(text) TO anon,authenticated,service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
    GRANT ALL ON storage.objects TO anon,authenticated,service_role;
  `);
  const directory = resolve(process.cwd(), 'supabase/migrations');
  for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(resolve(directory, name), 'utf8')); } catch (e) { throw new Error(`Migration ${name}: ${String(e)}`); }
  }
  for (const [id, role] of [[student,'worker'],[student2,'worker'],[employer,'business'],[otherEmployer,'business'],[admin,'worker'],[malicious,'ADMIN']]) {
    await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[id,`${id}@example.test`,{role}]);
  }
  await db.query("INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin')",[admin]);
  for (const id of [student,student2]) {
    await sqlAs(id,"SELECT public.complete_account_setup('worker')");
    await sqlAs(id,"UPDATE public.student_profiles SET adult_consent_at=now(),eligibility_confirmed=true,work_eligibility='Student permit declaration',consent_to_matching=true WHERE user_id=$1",[id]);
  }
  for (const id of [employer,otherEmployer]) {
    await sqlAs(id,"SELECT public.complete_account_setup('business')");
    await db.query("UPDATE public.businesses SET verification_status='verified',verification_reviewed_at=now(),verification_reviewed_by=$1 WHERE id=$2",[admin,id]);
  }
  const created = await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,end_time,salary_min,salary_max,currency,schedule_kind) VALUES($1,'Student internship',now()+interval '30 days',2500,3000,'AED','flexible') RETURNING id",[employer]);
  job = (created.rows[0] as {id:string}).id;
}, 60000);
afterAll(async () => { await db.close(); });

describe('database trusted authorization and hiring transactions', () => {
  it('never grants admin from editable signup metadata', async () => {
    const roles = await sqlAs(malicious,'SELECT role FROM public.user_roles WHERE user_id=$1',[malicious]);
    expect(roles.rows).toEqual([{role:'worker'}]);
    await expect(sqlAs(malicious,"UPDATE public.profiles SET role='admin' WHERE user_id=$1",[malicious])).rejects.toThrow(/permission denied/i);
    await expect(sqlAs(malicious,"INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin')",[malicious])).rejects.toThrow(/permission denied/i);
  });
  it('prevents self-verification and unverified publication', async () => {
    await expect(sqlAs(student,"UPDATE public.workers SET verification_status='verified' WHERE id=$1",[student])).rejects.toThrow(/permission denied/i);
    await expect(sqlAs(malicious,"INSERT INTO public.jobs(poster_id,title,end_time) VALUES($1,'forged',now()+interval '1 day')",[malicious])).rejects.toThrow(/row-level security/i);
    await expect(sqlAs(employer,"SELECT public.review_verification($1,'business','verified')",[employer])).rejects.toThrow(/Administrator required/);
  });
  it('limits private profile and calendar reads to their authorized users', async () => {
    expect((await sqlAs(otherEmployer,'SELECT * FROM public.profiles WHERE user_id=$1',[student])).rows).toHaveLength(0);
    await sqlAs(student,"INSERT INTO public.academic_calendar_events(user_id,source,external_uid,start_at,end_at) VALUES($1,'manual','lecture',now()+interval '1 day',now()+interval '1 day 1 hour')",[student]);
    expect((await sqlAs(employer,'SELECT * FROM public.academic_calendar_events')).rows).toHaveLength(0);
    await expect(sqlAs(employer,"UPDATE public.student_profiles SET eligibility_confirmed=true WHERE user_id=$1",[student])).resolves.toMatchObject({affectedRows:0});
  });
  it('submits once, notifies both parties, and rejects forged decisions', async () => {
    const result = await sqlAs(student,'SELECT public.submit_application($1,$2) AS id',[job,'I am interested in this internship.']);
    application=(result.rows[0] as {id:string}).id;
    await expect(sqlAs(student,'SELECT public.submit_application($1)',[job])).rejects.toThrow(/already applied/);
    await expect(sqlAs(student,"UPDATE public.applications SET status='accepted' WHERE id=$1",[application])).rejects.toThrow(/permission denied/i);
    await expect(sqlAs(student,"SELECT public.update_application_status($1,'accepted')",[application])).rejects.toThrow(/cannot make/);
    await expect(sqlAs(otherEmployer,"SELECT public.update_application_status($1,'shortlisted')",[application])).rejects.toThrow(/cannot make/);
    expect((await sqlAs(employer,'SELECT * FROM public.notifications')).rows).toHaveLength(1);
    expect((await sqlAs(student,'SELECT * FROM public.notifications')).rows).toHaveLength(1);
    expect((await sqlAs(otherEmployer,'SELECT * FROM public.applications')).rows).toHaveLength(0);
    expect((await sqlAs(employer,'SELECT * FROM public.profiles WHERE user_id=$1',[student])).rows).toHaveLength(1);
  });
  it('completes employer review, interview, offer, student acceptance, and placement', async () => {
    await sqlAs(employer,"SELECT public.update_application_status($1,'shortlisted')",[application]);
    await expect(sqlAs(employer,"SELECT public.update_application_status($1,'interview')",[application])).rejects.toThrow(/future interview/);
    await sqlAs(employer,"SELECT public.update_application_status($1,'interview',now()+interval '1 day','Bring your portfolio')",[application]);
    await sqlAs(employer,"SELECT public.update_application_status($1,'offered')",[application]);
    await sqlAs(student,"SELECT public.update_application_status($1,'accepted')",[application]);
    await sqlAs(employer,"SELECT public.update_application_status($1,'placed')",[application]);
    expect((await sqlAs(student,'SELECT status FROM public.applications WHERE id=$1',[application])).rows).toEqual([{status:'placed'}]);
    expect((await sqlAs(student,'SELECT * FROM public.application_audit_logs')).rows).toHaveLength(6);
    await expect(sqlAs(student,"SELECT public.update_application_status($1,'rejected')",[application])).rejects.toThrow(/cannot make/);
  });
  it('blocks applications without an adult/eligibility declaration or after expiry', async () => {
    await sqlAs(malicious,"SELECT public.complete_account_setup('worker')");
    await expect(sqlAs(malicious,'SELECT public.submit_application($1)',[job])).rejects.toThrow(/18\+/);
    const expired = await db.query("INSERT INTO public.jobs(poster_id,title,end_time,status) VALUES($1,'Expired',now()-interval '1 day','closed') RETURNING id",[employer]);
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[(expired.rows[0] as {id:string}).id])).rejects.toThrow(/closed, expired/);
  });
  it('enforces preferred windows and private academic travel conflicts on fixed shifts', async () => {
    const fixed=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,start_time,end_time,schedule_kind) VALUES($1,'Campus shift',date_trunc('day',now())+interval '10 days 9 hours',date_trunc('day',now())+interval '10 days 12 hours','fixed') RETURNING id",[employer]);
    const fixedId=(fixed.rows[0] as {id:string}).id;
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[fixedId])).rejects.toThrow(/preferred working hours/);
    await sqlAs(student2,'INSERT INTO public.availability_preferences(user_id,weekly_windows) VALUES($1,$2)',[student2,Array.from({length:7},(_,weekday)=>({weekday,start:'00:00',end:'24:00'}))]);
    await sqlAs(student2,"INSERT INTO public.academic_calendar_events(user_id,source,external_uid,start_at,end_at) SELECT $1,'manual','conflict',start_time-interval '15 minutes',start_time-interval '1 minute' FROM public.jobs WHERE id=$2",[student2,fixedId]);
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[fixedId])).rejects.toThrow(/calendar or travel buffer/);
    await sqlAs(student2,"DELETE FROM public.academic_calendar_events WHERE external_uid='conflict'");
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[fixedId])).resolves.toBeDefined();
  });
  it('enforces an atomic daily usage limit, server-authored notifications, and private CV storage', async () => {
    for(let i=0;i<5;i++) expect((await sqlAs(student,"SELECT public.consume_ai_budget('job_hunter') AS allowed")).rows).toEqual([{allowed:true}]);
    expect((await sqlAs(student,"SELECT public.consume_ai_budget('job_hunter') AS allowed")).rows).toEqual([{allowed:false}]);
    await expect(sqlAs(student,"INSERT INTO public.notifications(user_id,title,body) VALUES($1,'forged','forged')",[employer])).rejects.toThrow(/permission denied/i);
    expect((await db.query("SELECT public FROM storage.buckets WHERE id='cv_files'")).rows).toEqual([{public:false}]);
    for(let i=0;i<5;i++) expect((await sqlAs(student,"SELECT public.consume_ai_budget('chat') AS allowed")).rows).toEqual([{allowed:true}]);
    expect((await sqlAs(student,"SELECT public.consume_ai_budget('chat') AS allowed")).rows).toEqual([{allowed:false}]);
    await db.exec("UPDATE taawun_private.ai_usage SET used=100 WHERE feature='chat:global'");
    expect((await sqlAs(student2,"SELECT public.consume_ai_budget('chat') AS allowed")).rows).toEqual([{allowed:false}]);
  });
  it('runs trusted verification review and denies forged or cross-account KYC decisions', async () => {
    const uid='77777777-7777-4777-8777-777777777777';
    await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[uid,'unverified@example.test',{role:'business'}]);
    await sqlAs(uid,"SELECT public.complete_account_setup('business')");
    await expect(sqlAs(uid,"INSERT INTO public.jobs(poster_id,title,end_time) VALUES($1,'Blocked',now()+interval '1 day')",[uid])).rejects.toThrow(/row-level security/);
    await expect(sqlAs(uid,'SELECT public.request_verification()')).rejects.toThrow(/all required/);
    await expect(sqlAs(uid,"INSERT INTO public.kyc_documents(owner_id,owner_role,doc_type,storage_path,status) VALUES($1,'business','license',$2,'approved')",[uid,`kyb_business/${uid}/license.pdf`])).rejects.toThrow(/row-level security/);
    for(const kind of ['commercial_reg','license','rep_id']) {
      const doc=await sqlAs(uid,"INSERT INTO public.kyc_documents(owner_id,owner_role,doc_type,storage_path,status) VALUES($1,'business',$2,$3,'submitted') RETURNING id",[uid,kind,`kyb_business/${uid}/${kind}.pdf`]);
      const id=(doc.rows[0] as {id:string}).id;
      await expect(sqlAs(uid,"SELECT public.review_verification_document($1,'approved')",[id])).rejects.toThrow(/Administrator required/);
      await sqlAs(admin,"SELECT public.review_verification_document($1,'approved')",[id]);
    }
    await sqlAs(uid,'SELECT public.request_verification()');
    await sqlAs(admin,"SELECT public.review_verification($1,'business','verified')",[uid]);
    await expect(sqlAs(uid,"INSERT INTO public.jobs(poster_id,title,end_time) VALUES($1,'Reviewed',now()+interval '1 day')",[uid])).resolves.toBeDefined();
    await expect(sqlAs(uid,"UPDATE public.businesses SET verification_reviewed_by=$1 WHERE id=$2",[uid,uid])).rejects.toThrow(/permission denied/);
    const rejectedDoc=await db.query("SELECT id FROM public.kyc_documents WHERE owner_id=$1 AND doc_type='license'",[uid]);
    await sqlAs(admin,"SELECT public.review_verification_document($1,'rejected','Replacement evidence required')",[(rejectedDoc.rows[0] as {id:string}).id]);
    expect((await sqlAs(uid,'SELECT verification_status FROM public.businesses WHERE id=$1',[uid])).rows).toEqual([{verification_status:'rejected'}]);
    await expect(sqlAs(uid,"INSERT INTO public.jobs(poster_id,title,end_time) VALUES($1,'Blocked after revocation',now()+interval '1 day')",[uid])).rejects.toThrow(/row-level security/);
  });
  it('preserves existing timetable on invalid atomic import and disconnects only the caller', async () => {
    const events=[{external_uid:'ics-one',start_at:'2099-04-01T10:00:00Z',end_at:'2099-04-01T11:00:00Z',busy:true}];
    expect((await sqlAs(student,'SELECT public.replace_calendar_import($1) AS imported',[events])).rows).toEqual([{imported:1}]);
    await expect(sqlAs(student,'SELECT public.replace_calendar_import($1)',[[{...events[0],end_at:events[0].start_at}]])).rejects.toThrow(/Invalid calendar event/);
    expect((await sqlAs(student,"SELECT external_uid FROM public.academic_calendar_events WHERE source='ics'")).rows).toEqual([{external_uid:'ics-one'}]);
    await expect(sqlAs(student,'SELECT public.replace_calendar_import($1)',[[events[0],events[0]]])).rejects.toThrow(/duplicate key/);
    expect((await sqlAs(student,"SELECT external_uid FROM public.academic_calendar_events WHERE source='ics'")).rows).toHaveLength(1);
    await expect(sqlAs(employer,'SELECT public.replace_calendar_import($1)',[events])).rejects.toThrow(/Student account required/);
    await sqlAs(student2,'SELECT public.disconnect_calendar(\'ics\')');
    expect((await sqlAs(student,"SELECT external_uid FROM public.academic_calendar_events WHERE source='ics'")).rows).toHaveLength(1);
    await sqlAs(student,'SELECT public.disconnect_calendar(\'ics\')');
    expect((await sqlAs(student,"SELECT * FROM public.calendar_connections WHERE provider='ics'")).rows).toHaveLength(0);
  });
  it('rechecks student eligibility on offer acceptance and freezes agreed job terms', async () => {
    await expect(sqlAs(employer,"UPDATE public.jobs SET salary_min=1 WHERE id=$1",[job])).rejects.toThrow(/Agreed job terms/);
    await expect(sqlAs(employer,"UPDATE public.jobs SET status='draft' WHERE id=$1",[job])).rejects.toThrow(/cannot return to draft/);
    await sqlAs(employer,"UPDATE public.jobs SET status='closed' WHERE id=$1",[job]);
    expect((await sqlAs(student,'SELECT id FROM public.jobs WHERE id=$1',[job])).rows).toHaveLength(1);
    expect((await sqlAs(student2,'SELECT id FROM public.jobs WHERE id=$1',[job])).rows).toHaveLength(0);
    const next=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,end_time,schedule_kind) VALUES($1,'Next role',now()+interval '30 days','flexible') RETURNING id",[employer]);
    const nextId=(next.rows[0] as {id:string}).id;
    const app=await sqlAs(student2,'SELECT public.submit_application($1) AS id',[nextId]);
    const appId=(app.rows[0] as {id:string}).id;
    await sqlAs(employer,"SELECT public.update_application_status($1,'offered')",[appId]);
    await sqlAs(student2,'UPDATE public.student_profiles SET eligibility_confirmed=false WHERE user_id=$1',[student2]);
    await expect(sqlAs(student2,"SELECT public.update_application_status($1,'accepted')",[appId])).rejects.toThrow(/18\+/);
    await sqlAs(student2,'UPDATE public.student_profiles SET eligibility_confirmed=true WHERE user_id=$1',[student2]);
  });
  it('checks actual instants across DST fall-back and merges adjacent preferred windows', async () => {
    const dst=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,start_time,end_time,schedule_kind) VALUES($1,'DST shift','2099-11-01T05:50:00Z','2099-11-01T06:10:00Z','fixed') RETURNING id",[employer]);
    // Use a known future first-Sunday date for a genuine repeated clock hour.
    await db.query("UPDATE public.jobs SET start_time='2099-11-01T05:50:00Z',end_time='2099-11-01T06:10:00Z' WHERE id=$1",[(dst.rows[0] as {id:string}).id]);
    await sqlAs(student2,'UPDATE public.availability_preferences SET timezone=$1,minimum_shift_minutes=15,weekly_windows=$2 WHERE user_id=$3',['America/New_York',Array.from({length:7},(_,weekday)=>({weekday,start:'09:00',end:'17:00'})),student2]);
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[(dst.rows[0] as {id:string}).id])).rejects.toThrow(/outside your preferred/);
    const adjacent=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,start_time,end_time,schedule_kind) VALUES($1,'Adjacent windows','2099-04-01T05:00:00Z','2099-04-01T09:00:00Z','fixed') RETURNING id",[employer]);
    await sqlAs(student2,'UPDATE public.availability_preferences SET timezone=$1,weekly_windows=$2 WHERE user_id=$3',['Asia/Dubai',Array.from({length:7},(_,weekday)=>[{weekday,start:'09:00',end:'11:00'},{weekday,start:'11:00',end:'13:00'}]).flat(),student2]);
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[(adjacent.rows[0] as {id:string}).id])).resolves.toBeDefined();
  });
  it('delivers candidate invitations only after consent and employer approval, with idempotency', async () => {
    const listing=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,end_time) VALUES($1,'Invitation role',now()+interval '10 days') RETURNING id",[employer]);
    const listingId=(listing.rows[0] as {id:string}).id;
    const match=await db.query("INSERT INTO public.candidate_matches(business_id,worker_id,job_id,score) VALUES($1,$2,$3,90) RETURNING id",[employer,student,listingId]);
    const draft=await db.query('INSERT INTO public.candidate_outreach_drafts(business_id,worker_id,job_id,match_id,outreach_message) VALUES($1,$2,$3,$4,$5) RETURNING id',[employer,student,listingId,(match.rows[0] as {id:string}).id,'Please review this opportunity.']);
    const draftId=(draft.rows[0] as {id:string}).id;
    await expect(sqlAs(otherEmployer,'SELECT public.send_candidate_outreach($1)',[draftId])).rejects.toThrow(/unavailable/);
    await sqlAs(student,'UPDATE public.student_profiles SET consent_to_matching=false WHERE user_id=$1',[student]);
    await expect(sqlAs(employer,'SELECT public.send_candidate_outreach($1)',[draftId])).rejects.toThrow(/not consented/);
    await sqlAs(student,'UPDATE public.student_profiles SET consent_to_matching=true WHERE user_id=$1',[student]);
    await sqlAs(employer,'SELECT public.send_candidate_outreach($1)',[draftId]);
    await sqlAs(employer,'SELECT public.send_candidate_outreach($1)',[draftId]);
    expect((await sqlAs(student,"SELECT * FROM public.notifications WHERE event_type='candidate_invitation'")).rows).toHaveLength(1);
    await expect(sqlAs(student,"SELECT public.consume_ai_budget_for_user($1,'job_hunter')",[student2])).rejects.toThrow(/permission denied/);
  });
  it('enforces pause, consent, score, current filters, facts, and daily limits inside AI approval RPC', async () => {
    await sqlAs(student,"INSERT INTO public.ai_agent_settings(user_id,mode,paused,daily_application_limit,minimum_match_score) VALUES($1,'APPROVAL',true,1,80)",[student]);
    await sqlAs(student,"INSERT INTO public.job_preferences(user_id,locations,salary_min,salary_currency) VALUES($1,ARRAY['Dubai'],2500,'AED')",[student]);
    const createDraft=async(title:string)=>{
      const listing=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,company_name,location,end_time,payment_model,salary_min,salary_max,skills_required,experience_years) VALUES($1,$2,'Example Employer','Dubai',now()+interval '30 days','monthly',2500,3000,ARRAY['Excel'],2) RETURNING id",[employer,title]);
      const jid=(listing.rows[0] as {id:string}).id;
      const match=await db.query('INSERT INTO public.ai_job_matches(user_id,job_id,score) VALUES($1,$2,90) RETURNING id',[student,jid]);
      const draft=await db.query('INSERT INTO public.ai_application_drafts(user_id,job_id,match_id,cover_letter) VALUES($1,$2,$3,$4) RETURNING id',[student,jid,(match.rows[0] as {id:string}).id,'Profile facts prepared for explicit approval.']);
      return {jid,did:(draft.rows[0] as {id:string}).id};
    };
    const {jid,did}=await createDraft('AI approval role');
    const submit=()=>sqlAs(student,'SELECT public.submit_application($1,NULL,$2)',[jid,did]);
    await expect(submit()).rejects.toThrow(/paused/);
    await sqlAs(student,'UPDATE public.ai_agent_settings SET paused=false WHERE user_id=$1',[student]);
    await sqlAs(student,'UPDATE public.student_profiles SET consent_to_matching=false WHERE user_id=$1',[student]);
    await expect(submit()).rejects.toThrow(/consent/);
    await sqlAs(student,'UPDATE public.student_profiles SET consent_to_matching=true WHERE user_id=$1',[student]);
    await sqlAs(student,'UPDATE public.ai_agent_settings SET minimum_match_score=95 WHERE user_id=$1',[student]);
    await expect(submit()).rejects.toThrow(/minimum score/);
    await sqlAs(student,"UPDATE public.ai_agent_settings SET minimum_match_score=80,excluded_companies=ARRAY['Example Employer'] WHERE user_id=$1",[student]);
    await expect(submit()).rejects.toThrow(/excluded/);
    await sqlAs(student,"UPDATE public.ai_agent_settings SET excluded_companies='{}' WHERE user_id=$1",[student]);
    await sqlAs(student,"UPDATE public.job_preferences SET locations=ARRAY['Abu Dhabi'] WHERE user_id=$1",[student]);
    await expect(submit()).rejects.toThrow(/location/);
    await sqlAs(student,"UPDATE public.job_preferences SET locations=ARRAY['Dubai'] WHERE user_id=$1",[student]);
    await sqlAs(employer,"UPDATE public.jobs SET payment_model='hourly',pay_amount=50 WHERE id=$1",[jid]);
    await expect(submit()).rejects.toThrow(/Pay period/);
    await sqlAs(employer,"UPDATE public.jobs SET payment_model='monthly' WHERE id=$1",[jid]);
    await expect(submit()).rejects.toThrow(/required skill/);
    await sqlAs(student,"UPDATE public.student_profiles SET skills=ARRAY['Excel'] WHERE user_id=$1",[student]);
    await expect(submit()).rejects.toThrow(/experience/);
    await sqlAs(student,'INSERT INTO public.cv_records(user_id,skills,experience) VALUES($1,$2,$3)',[student,['Excel'],[{startDate:'2020-01',endDate:'2023-01',current:false}]]);
    await expect(submit()).resolves.toBeDefined();
    expect((await sqlAs(student,'SELECT status FROM public.ai_job_matches WHERE job_id=$1',[jid])).rows).toEqual([{status:'submitted'}]);
    expect((await sqlAs(student,'SELECT is_auto_applied FROM public.applications WHERE job_id=$1',[jid])).rows).toEqual([{is_auto_applied:false}]);
    const next=await createDraft('Second AI role');
    await expect(sqlAs(student,'SELECT public.submit_application($1,NULL,$2)',[next.jid,next.did])).rejects.toThrow(/Daily prepared application limit/);
  });
  it('lets an existing offer be accepted after application deadline while retaining current eligibility checks', async () => {
    const listing=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,end_time,deadline) VALUES($1,'Existing offer',now()+interval '20 days',now()+interval '1 day') RETURNING id",[employer]);
    const jid=(listing.rows[0] as {id:string}).id;
    const application=await sqlAs(student2,'SELECT public.submit_application($1) AS id',[jid]);
    const id=(application.rows[0] as {id:string}).id;
    await sqlAs(employer,"SELECT public.update_application_status($1,'offered')",[id]);
    await sqlAs(employer,"UPDATE public.jobs SET deadline=now()-interval '1 hour',status='in_progress' WHERE id=$1",[jid]);
    await expect(sqlAs(student2,"SELECT public.update_application_status($1,'accepted')",[id])).resolves.toBeDefined();
  });
  it('exposes only reviewed public employer summaries and restricts callable definer privileges', async () => {
    await db.exec('SET ROLE anon');
    try {
      await expect(db.query('SELECT email FROM public.profiles')).rejects.toThrow(/permission denied/);
      const summary=await db.query('SELECT * FROM public.get_public_businesses($1)',[[employer]]);
      expect(summary.rows).toHaveLength(1);expect(Object.keys(summary.rows[0])).toEqual(['id','trade_name','sector','logo_url','rating_avg','rating_count']);
      await expect(db.query("SELECT public.review_verification($1,'business','verified')",[employer])).rejects.toThrow(/permission denied/);
      await expect(db.query('SELECT public.replace_calendar_import($1)',[[]])).rejects.toThrow(/permission denied/);
    } finally { await db.exec('RESET ROLE'); }
    const grants=await db.query("SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND has_function_privilege('anon',p.oid,'EXECUTE')");
    expect(grants.rows).toEqual([{proname:'get_public_businesses'}]);
  });
  it('shares a consented recommendation name without exposing contact details or CV before application', async () => {
    const uid='88888888-8888-4888-8888-888888888888';
    await db.query('INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)',[uid,'private-student@example.test',{role:'worker'}]);
    await sqlAs(uid,"SELECT public.complete_account_setup('worker','A Student')");
    await sqlAs(uid,'UPDATE public.student_profiles SET adult_consent_at=now(),consent_to_matching=true WHERE user_id=$1',[uid]);
    await sqlAs(uid,"INSERT INTO public.cv_records(user_id,summary) VALUES($1,'Private CV details')",[uid]);
    const listing=await db.query("SELECT id FROM public.jobs WHERE poster_id=$1 AND status='open' LIMIT 1",[employer]);
    await db.query('INSERT INTO public.candidate_matches(business_id,worker_id,job_id,score) VALUES($1,$2,$3,90)',[employer,uid,(listing.rows[0] as {id:string}).id]);
    expect((await sqlAs(employer,'SELECT * FROM public.profiles WHERE user_id=$1',[uid])).rows).toHaveLength(0);
    expect((await sqlAs(employer,'SELECT * FROM public.cv_records WHERE user_id=$1',[uid])).rows).toHaveLength(0);
    expect((await sqlAs(employer,'SELECT * FROM public.get_candidate_summaries($1)',[[uid]])).rows).toEqual([{user_id:uid,full_name:'A Student'}]);
    expect((await sqlAs(otherEmployer,'SELECT * FROM public.get_candidate_summaries($1)',[[uid]])).rows).toHaveLength(0);
    await sqlAs(uid,'UPDATE public.student_profiles SET consent_to_matching=false WHERE user_id=$1',[uid]);
    expect((await sqlAs(employer,'SELECT * FROM public.get_candidate_summaries($1)',[[uid]])).rows).toHaveLength(0);
  });
  it('fails closed outside known ICS coverage and prevents client-authored sync extensions', async () => {
    await sqlAs(student2,'UPDATE public.availability_preferences SET timezone=$1,weekly_windows=$2,minimum_shift_minutes=15 WHERE user_id=$3',['Asia/Dubai',Array.from({length:7},(_,weekday)=>({weekday,start:'09:00',end:'13:00'})),student2]);
    await sqlAs(student2,'SELECT public.replace_calendar_import($1)',[[]]);
    await expect(sqlAs(student2,"UPDATE public.calendar_connections SET last_synced_at=now()+interval '1 year' WHERE user_id=$1",[student2])).rejects.toThrow(/permission denied/);
    const outside=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,start_time,end_time,schedule_kind) VALUES($1,'Beyond imported timetable',((current_date+121)+time '09:00') AT TIME ZONE 'Asia/Dubai',((current_date+121)+time '12:00') AT TIME ZONE 'Asia/Dubai','fixed') RETURNING id",[employer]);
    const outsideId=(outside.rows[0] as {id:string}).id;
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[outsideId])).rejects.toThrow(/120-day calendar coverage/);
    const inside=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,start_time,end_time,schedule_kind) VALUES($1,'Within imported timetable',((current_date+2)+time '09:00') AT TIME ZONE 'Asia/Dubai',((current_date+2)+time '11:00') AT TIME ZONE 'Asia/Dubai','fixed') RETURNING id",[employer]);
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[(inside.rows[0] as {id:string}).id])).resolves.toBeDefined();
    await db.query("UPDATE public.calendar_connections SET last_synced_at=NULL WHERE user_id=$1 AND provider='ics'",[student2]);
    const unknown=await sqlAs(employer,"INSERT INTO public.jobs(poster_id,title,start_time,end_time,schedule_kind) VALUES($1,'Unknown import coverage',((current_date+3)+time '09:00') AT TIME ZONE 'Asia/Dubai',((current_date+3)+time '11:00') AT TIME ZONE 'Asia/Dubai','fixed') RETURNING id",[employer]);
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[(unknown.rows[0] as {id:string}).id])).rejects.toThrow(/120-day calendar coverage/);
    await sqlAs(student2,"SELECT public.disconnect_calendar('ics')");
    await expect(sqlAs(student2,'SELECT public.submit_application($1)',[outsideId])).resolves.toBeDefined();
  });
});
