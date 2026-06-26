import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

interface ChatMessage {
  role: string;
  content: string;
}

interface ToolDefinition {
  type: string;
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

interface ToolChoice {
  type: string;
  function: { name: string };
}

interface JobRow {
  id: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  job_type?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  skills_required?: string[] | null;
  experience_years?: number | null;
  remote_allowed?: boolean | null;
  sector?: string | null;
  [key: string]: unknown;
}

interface CandidateRow {
  user_id: string;
  summary?: string | null;
  skills?: string[] | null;
  experience?: unknown;
  education?: unknown;
  languages?: unknown;
  personal_info?: Record<string, unknown> | null;
  [key: string]: unknown;
}

interface BusinessSettings {
  mode: "MANUAL" | "APPROVAL" | "AUTO";
  minimum_match_score: number;
  daily_outreach_limit: number;
  target_roles: string[];
  locations: string[];
  excluded_keywords: string[];
}

interface ScoreResult {
  score: number;
  explanation: string;
  strengths?: string[];
  gaps?: string[];
}

async function callAI(messages: ChatMessage[], tools?: ToolDefinition[], tool_choice?: ToolChoice) {
  const body: Record<string, unknown> = {
    model: "google/gemini-2.5-flash",
    messages,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = tool_choice;
  }
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI ${r.status}: ${t}`);
  }
  return r.json();
}

async function getBusinessSettings(businessId: string): Promise<BusinessSettings> {
  const { data } = await admin
    .from("candidate_hunter_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  return {
    mode: (data?.mode as BusinessSettings["mode"]) ?? "MANUAL",
    minimum_match_score: data?.minimum_match_score ?? 80,
    daily_outreach_limit: data?.daily_outreach_limit ?? 10,
    target_roles: data?.target_roles ?? [],
    locations: data?.locations ?? [],
    excluded_keywords: data?.excluded_keywords ?? [],
  };
}

async function scoreCandidate(cv: CandidateRow, job: JobRow): Promise<ScoreResult> {
  const messages = [
    {
      role: "system",
      content:
        "You are a strict recruiting matching engine. Score how well a candidate matches a job from 0-100. Be honest, never invent experience the candidate doesn't have. Output via the score_candidate tool only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        candidate: {
          summary: cv.summary,
          skills: cv.skills,
          experience: cv.experience,
          education: cv.education,
          languages: cv.languages,
        },
        job: {
          title: job.title,
          description: job.description,
          location: job.location,
          job_type: job.job_type,
          employment_type: job.employment_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          skills_required: job.skills_required,
          experience_years: job.experience_years,
          remote_allowed: job.remote_allowed,
          sector: job.sector,
        },
      }),
    },
  ];
  const tool = {
    type: "function",
    function: {
      name: "score_candidate",
      description: "Return match score and explanation",
      parameters: {
        type: "object",
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          explanation: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          gaps: { type: "array", items: { type: "string" } },
        },
        required: ["score", "explanation", "strengths", "gaps"],
      },
    },
  };
  const res = await callAI(messages, [tool], { type: "function", function: { name: "score_candidate" } });
  const call = res.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("No tool call");
  return JSON.parse(call.function.arguments) as ScoreResult;
}

async function draftOutreachMessage(cv: CandidateRow, job: JobRow, score: ScoreResult) {
  const messages = [
    {
      role: "system",
      content:
        "Write a concise, friendly outreach message (max 120 words) inviting the candidate to apply for the role. Never invent details about the candidate. Mention one specific strength from their profile. Plain text only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        candidate: {
          name: (cv.personal_info as { fullName?: string } | undefined)?.fullName,
          summary: cv.summary,
          skills: cv.skills,
        },
        job: { title: job.title, description: job.description },
        match: score,
      }),
    },
  ];
  const res = await callAI(messages);
  return res.choices?.[0]?.message?.content ?? "";
}

async function log(businessId: string, action: string, reason: string, jobId?: string, workerId?: string, metadata?: Record<string, unknown>) {
  await admin.from("candidate_hunter_logs").insert({
    business_id: businessId,
    action,
    reason,
    job_id: jobId ?? null,
    worker_id: workerId ?? null,
    metadata: metadata ?? {},
  });
}

async function runForBusiness(businessId: string, opts: { limit?: number } = {}) {
  const settings = await getBusinessSettings(businessId);

  const { data: jobs = [] } = await admin
    .from("jobs")
    .select("*")
    .eq("poster_id", businessId)
    .eq("status", "open")
    .limit(opts.limit ?? 10);

  if (!jobs || jobs.length === 0) {
    await log(businessId, "skipped_run", "No open jobs posted");
    return { scanned: 0, matched: 0, outreached: 0, drafted: 0, reason: "no_open_jobs" };
  }

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
  const { data: candidates = [] } = await admin
    .from("cv_records")
    .select("*")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(opts.limit ?? 25);

  const { data: existing = [] } = await admin
    .from("candidate_matches")
    .select("job_id, worker_id")
    .eq("business_id", businessId);
  const seen = new Set((existing ?? []).map((m: { job_id: string; worker_id: string }) => `${m.job_id}:${m.worker_id}`));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { count: outreachedToday = 0 } = await admin
    .from("candidate_outreach_drafts")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("sent", true)
    .gte("created_at", today.toISOString());

  let scanned = 0, matched = 0, drafted = 0, outreached = outreachedToday ?? 0;
  const startOutreached = outreached;

  for (const job of jobs as JobRow[]) {
    for (const cv of candidates as CandidateRow[]) {
      const workerId = cv.user_id;
      if (seen.has(`${job.id}:${workerId}`)) continue;
      scanned++;

      const text = `${(cv.summary as string) ?? ""} ${((cv.skills as string[]) ?? []).join(" ")}`.toLowerCase();
      const excludedKw = settings.excluded_keywords.some((k) => text.includes(k.toLowerCase()));
      if (excludedKw) {
        await log(businessId, "skipped_candidate", "Excluded by business filters", job.id, workerId);
        continue;
      }

      let s: ScoreResult;
      try {
        s = await scoreCandidate(cv, job);
      } catch (e) {
        await log(businessId, "error", `Scoring failed: ${e instanceof Error ? e.message : e}`, job.id, workerId);
        continue;
      }

      let status: string = "matched";
      if (s.score < 50) status = "skipped";
      else if (s.score < settings.minimum_match_score) status = "needs_review";
      else status = "matched";

      matched++;

      const { data: matchRow } = await admin
        .from("candidate_matches")
        .insert({
          business_id: businessId,
          job_id: job.id,
          worker_id: workerId,
          score: s.score,
          explanation: s.explanation,
          strengths: s.strengths ?? [],
          gaps: s.gaps ?? [],
          status,
        })
        .select()
        .single();

      await log(businessId, "scored_candidate", s.explanation, job.id, workerId, { score: s.score });

      // Auto-outreach gate — only "AUTO" mode reaches out without business approval,
      // mirroring the worker-side auto_apply_enabled && !require_user_approval gate.
      if (
        settings.mode === "AUTO" &&
        s.score >= settings.minimum_match_score &&
        outreached < settings.daily_outreach_limit
      ) {
        try {
          const message = await draftOutreachMessage(cv, job, s);
          const { data: draft } = await admin
            .from("candidate_outreach_drafts")
            .insert({ business_id: businessId, job_id: job.id, worker_id: workerId, match_id: matchRow?.id, outreach_message: message, sent: true })
            .select()
            .single();
          drafted++;

          await admin.from("candidate_matches").update({ status: "outreached" }).eq("id", matchRow?.id);
          outreached++;
          await log(businessId, "outreached", `Match ${s.score}% — reached out automatically`, job.id, workerId, { draft_id: draft?.id });
        } catch (e) {
          await log(businessId, "error", `Auto-outreach failed: ${e instanceof Error ? e.message : e}`, job.id, workerId);
        }
      } else if (s.score >= settings.minimum_match_score) {
        // Draft only for business review (MANUAL or APPROVAL mode)
        try {
          const message = await draftOutreachMessage(cv, job, s);
          await admin
            .from("candidate_outreach_drafts")
            .insert({ business_id: businessId, job_id: job.id, worker_id: workerId, match_id: matchRow?.id, outreach_message: message, sent: false });
          await admin.from("candidate_matches").update({ status: "drafted" }).eq("id", matchRow?.id);
          drafted++;
          await log(businessId, "drafted", "Outreach draft ready for review", job.id, workerId);
        } catch (e) {
          await log(businessId, "error", `Draft failed: ${e instanceof Error ? e.message : e}`, job.id, workerId);
        }
      }
    }
  }

  await admin
    .from("candidate_hunter_settings")
    .upsert({ business_id: businessId, last_run_at: new Date().toISOString() }, { onConflict: "business_id" });

  return { scanned, matched, drafted, outreached: outreached - startOutreached };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "run_business";
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    if (action === "run_all") {
      // Cron entrypoint — gated behind a shared secret, not just "no auth header
      // present". Anyone who finds this URL without the secret gets rejected.
      if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: settings = [] } = await admin
        .from("candidate_hunter_settings")
        .select("business_id")
        .neq("mode", "MANUAL");
      const results: Record<string, unknown>[] = [];
      for (const s of settings) {
        try {
          results.push({ business_id: s.business_id, ...(await runForBusiness(s.business_id, { limit: 10 })) });
        } catch (e) {
          results.push({ business_id: s.business_id, error: String(e) });
        }
      }
      return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auth for all per-user actions
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "run_business") {
      const r = await runForBusiness(user.id, { limit: body.limit ?? 10 });
      return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send_draft") {
      const draftId = body.draft_id;
      const { data: draft } = await admin.from("candidate_outreach_drafts").select("*").eq("id", draftId).eq("business_id", user.id).maybeSingle();
      if (!draft) return new Response(JSON.stringify({ error: "Draft not found" }), { status: 404, headers: corsHeaders });

      const { error } = await admin.from("candidate_outreach_drafts").update({ sent: true }).eq("id", draft.id);
      if (error) throw error;

      await admin.from("candidate_matches").update({ status: "outreached" }).eq("id", draft.match_id);
      await log(user.id, "business_approved_draft", "Manually approved outreach draft", draft.job_id, draft.worker_id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
