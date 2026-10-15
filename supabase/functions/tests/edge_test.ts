import { handleEdge } from '../_shared/runtime.ts';

const uid = '11111111-1111-4111-8111-111111111111';
const originalFetch = globalThis.fetch;
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
function configuration() {
  Deno.env.set('SUPABASE_URL', 'https://fixture.supabase.co');
  Deno.env.set('SUPABASE_ANON_KEY', 'fixture-publishable-key');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'fixture-server-key');
  Deno.env.set('APP_ORIGINS', 'http://localhost:5173');
  Deno.env.set('AI_PROVIDER_ENABLED', 'false');
  Deno.env.set('CRON_ENABLED', 'false');
  Deno.env.delete('CRON_SECRET');
}
function request(action: string, token = true, body: unknown = {}) {
  return new Request(`https://fixture.supabase.co/functions/v1/ai-job-hunter?action=${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer fixture-session' } : {}) }, body: JSON.stringify(body) });
}
function fixture(roles: string[] = ['worker'], quota = true, profile: unknown = null, allowProvider = false) {
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = input instanceof Request ? input.url : String(input); calls.push(url);
    let data: unknown;
    if (url.endsWith('/auth/v1/user')) data = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'student@example.test', email_confirmed_at: '2026-10-01', app_metadata: {}, user_metadata: { role: 'admin' } };
    else if (url.includes('/rest/v1/user_roles')) data = roles.map(role => ({ role }));
    else if (url.includes('/rest/v1/rpc/consume_ai_budget')) data = quota;
    else if (url.includes('/rest/v1/student_profiles')) data = profile;
    else if (url.includes('/rest/v1/cv_records')) data = { summary: 'University project', skills: ['Excel'], experience: [], education: [] };
    else if (url.includes('api.anthropic.com') && allowProvider) {
      return new Response('event: content_block_delta\ndata: {"delta":{"text":"Review the internship requirements."}}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
    }
    else throw new Error(`Unexpected network attempt: ${url}`);
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  };
  return calls;
}
Deno.test('handlers reject unauthenticated requests and disabled cron before any privileged network work', async () => {
  configuration(); const calls=fixture();
  try {
    assert((await handleEdge(request('run_user', false), 'job_hunter')).status===401, 'anonymous run must fail');
    assert((await handleEdge(request('run_all', false), 'job_hunter')).status===401, 'disabled scheduler must fail');
    assert((await handleEdge(request('run_all', false), 'candidate_hunter')).status===401, 'candidate scheduler must fail');
    assert(calls.length===0, 'no database or provider call is allowed before authorization');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('editable metadata cannot authorize the wrong audience or a paid provider call', async () => {
  configuration(); const calls=fixture(['worker']);
  try {
    assert((await handleEdge(request('run_business'), 'candidate_hunter')).status===403, 'worker cannot use employer matching despite admin metadata');
    assert((await handleEdge(request('chat', true, {messages:[{role:'user',content:'Help me find an internship'}]}), 'chat')).status===503, 'provider is disabled');
    assert(!calls.some(url=>url.includes('anthropic')||url.includes('lovable')), 'paid provider must never be called');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('durable quota rejects a run before jobs or private CV records are scanned', async () => {
  configuration(); const calls=fixture(['worker'],false);
  try {
    assert((await handleEdge(request('run_user', true, {limit:20}), 'job_hunter')).status===429, 'quota must reject run');
    assert(calls.some(url=>url.includes('consume_ai_budget')), 'quota must be checked');
    assert(!calls.some(url=>url.includes('/jobs')||url.includes('/cv_records')), 'no matching work after quota denial');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('endpoint method, cross-origin and bounded-body rules execute before matching work', async () => {
  configuration(); const calls=fixture();
  try {
    assert((await handleEdge(new Request('https://fixture.test'), 'job_hunter')).status===405, 'GET disallowed');
    assert((await handleEdge(new Request('https://fixture.test',{method:'OPTIONS',headers:{Origin:'https://untrusted.test'}}), 'job_hunter')).status===403, 'unknown browser origin disallowed');
    assert((await handleEdge(request('run_user', true, {limit:999}), 'job_hunter')).status===400, 'unbounded scan disallowed');
    assert(!calls.some(url=>url.includes('consume_ai_budget')), 'invalid limits cannot trigger a run');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('paid chat requires explicit student consent before any CV/provider request', async () => {
  configuration();Deno.env.set('AI_PROVIDER_ENABLED','true');Deno.env.set('ANTHROPIC_API_KEY','fixture-provider-key');
  const calls=fixture(['worker'],true,{adult_consent_at:'2026-10-01',consent_to_matching:false});
  try {
    assert((await handleEdge(request('chat',true,{messages:[{role:'user',content:'Career advice'}]}),'chat')).status===403,'revoked consent must block paid chat');
    assert(!calls.some(url=>url.includes('cv_records')||url.includes('anthropic')),'no private CV or provider access without consent');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('a configured consenting chat can stream only through a mocked provider', async () => {
  configuration();Deno.env.set('AI_PROVIDER_ENABLED','true');Deno.env.set('ANTHROPIC_API_KEY','fixture-provider-key');
  const calls=fixture(['worker'],true,{adult_consent_at:'2026-10-01',consent_to_matching:true,skills:['Excel']},true);
  try {
    const response=await handleEdge(request('chat',true,{messages:[{role:'user',content:'Career advice'}]}),'chat');
    assert(response.status===200,'mock provider stream should return successfully');
    assert((await response.text()).includes('Review the internship'),'response body must stream provider text');
    assert(calls.some(url=>url.includes('consume_ai_budget')),'a paid-provider path must consume durable budget');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('candidate matching respects explicit availability sharing before reading or publishing schedule fit', async () => {
  configuration();
  const studentId='22222222-2222-4222-8222-222222222222';
  const jobId='33333333-3333-4333-8333-333333333333';
  const matchId='44444444-4444-4444-8444-444444444444';
  const reviewerId='55555555-5555-4555-8555-555555555555';
  for (const share of [false,true]) {
    const calls:string[]=[];const persisted: {table:string;data:Record<string,unknown>}[]=[];
    globalThis.fetch=async(input,init)=>{
      const url=input instanceof Request?input.url:String(input);const parsed=new URL(url);calls.push(url);
      const table=parsed.pathname.split('/').pop()??'';
      const method=init?.method??(input instanceof Request?input.method:'GET');
      const body=typeof init?.body==='string'?JSON.parse(init.body):null;
      let data:unknown;
      if(url.endsWith('/auth/v1/user'))data={id:uid,aud:'authenticated',role:'authenticated',email:'employer@example.test',email_confirmed_at:'2026-10-01',app_metadata:{},user_metadata:{}};
      else if(table==='user_roles')data=parsed.searchParams.has('role')?{role:'admin'}:[{role:'business'}];
      else if(table==='businesses')data={verification_status:'verified',verification_reviewed_at:'2026-10-01',verification_reviewed_by:reviewerId};
      else if(table==='consume_ai_budget')data=true;
      else if(table==='candidate_hunter_settings')data=method==='GET'?{minimum_match_score:80,paused:false,target_roles:[],locations:[],excluded_keywords:[]}:null;
      else if(table==='jobs')data=[{id:jobId,poster_id:uid,title:'Internship shift',status:'open',start_time:'2099-04-01T05:00:00Z',end_time:'2099-04-01T09:00:00Z',schedule_kind:'fixed',currency:'AED',skills_required:['Excel'],experience_years:0,job_type:'internship',slots_total:1,slots_filled:0}];
      else if(table==='student_profiles')data=[{user_id:studentId,adult_consent_at:'2026-10-01',eligibility_confirmed:true,work_eligibility:'Student declaration',consent_to_matching:true,skills:['Excel']}];
      else if(table==='cv_records')data={skills:['Excel'],experience:[]};
      else if(table==='job_preferences')data={job_types:['internship'],locations:[]};
      else if(table==='availability_preferences')data={timezone:'Asia/Dubai',weekly_windows:Array.from({length:7},(_,weekday)=>({weekday,start:'09:00',end:'17:00'})),minimum_shift_minutes:120,travel_buffer_minutes:30,share_with_employers:share};
      else if(table==='academic_calendar_events'||table==='calendar_connections'){
        assert(share,'private timetable or coverage was read despite sharing being disabled');
        data=table==='academic_calendar_events'?[]:null;
      }
      else if(table==='candidate_matches'){
        if(method==='GET')data=null;
        else{if(body)persisted.push({table,data:body});data=method==='POST'?{id:matchId}:null;}
      }
      else if(table==='candidate_outreach_drafts')data=method==='GET'?[]:null;
      else if(table==='candidate_hunter_logs'){if(body)persisted.push({table,data:body});data=null;}
      else throw new Error(`Unexpected fixture request: ${url}`);
      return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
    };
    try{
      const response=await handleEdge(request('run_business',true,{limit:1}),'candidate_hunter');
      assert(response.status===200,`candidate run failed: ${await response.text()}`);
      const match=persisted.find(row=>row.table==='candidate_matches'&&Array.isArray(row.data.strengths))?.data;
      assert(match,'a candidate match should be persisted');
      const scheduleReads=calls.filter(url=>url.includes('academic_calendar_events')||url.includes('calendar_connections'));
      if(share){
        assert(scheduleReads.length===2,'shared schedule should read busy events and coverage');
        assert((match!.strengths as string[]).some(reason=>/Fits preferred hours/.test(reason)),'explicit sharing should permit a schedule-fit explanation');
        assert(match!.status==='matched','shared compatible schedule should be eligible');
      }else{
        assert(scheduleReads.length===0,'unshared schedule must never be read');
        assert(match!.status==='skipped','fixed shifts require generic student confirmation without sharing');
        assert((match!.gaps as string[]).some(reason=>/confirmation/i.test(reason)),'private schedule should be represented as unknown');
        const explanations=persisted.map(row=>JSON.stringify({strengths:row.data.strengths,gaps:row.data.gaps,reason:row.data.reason})).join(' ');
        assert(!/Fits preferred hours|recorded academic commitments|busy period|travel buffer|calendar conflict/i.test(explanations),'unshared calendar-derived fit or conflicts must never be published');
      }
    }finally{globalThis.fetch=originalFetch;}
  }
});
