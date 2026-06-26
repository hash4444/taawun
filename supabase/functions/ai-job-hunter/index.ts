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
  company_name?: string | null;
  [key: string]: unknown;
}

interface ProfileContext {
  profile: Record<string, unknown> | null;
  cv: Record<string, unknown> | null;
  prefs: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
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

async function getProfileContext(userId: string) {
  const [{ data: profile }, { data: cv }, { data: prefs }, { data: settings }] = await Promise.all([
    admin.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("cv_records").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("job_preferences").select("*").eq("user_id", userId).maybeSingle(),
    admin.from("ai_agent_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  return { profile, cv, prefs, settings };
}

async function scoreJob(ctx: ProfileContext, job: JobRow): Promise<ScoreResult> {
  const cv = (ctx.cv ?? {}) as Record<string, unknown>;
  const prefs = ctx.prefs ?? {};
  const messages = [
    {
      role: "system",
      content:
        "You are a strict career matching engine. Score how well a candidate matches a job from 0-100. Be honest. Output via the score_job tool only.",
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
          preferences: prefs,
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
      name: "score_job",
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
  const res = await callAI(messages, [tool], { type: "function", function: { name: "score_job" } });
  const call = res.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("No tool call");
  return JSON.parse(call.function.arguments) as ScoreResult;
}

async function draftCoverLetter(ctx: ProfileContext, job: JobRow, score: ScoreResult) {
  const cv = (ctx.cv ?? {}) as Record<string, unknown>;
  const messages = [
    {
      role: "system",
      content:
        "Write a concise, honest cover letter (max 180 words). Never invent experience. If a required skill is missing, acknowledge willingness to learn. Plain text only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        candidate: {
          summary: cv.summary,
          skills: cv.skills,
          experience: cv.experience,
          name: (cv.personal_info as { fullName?: string } | undefined)?.fullName,
        },
        job: { title: job.title, description: job.description, company: job.company_name },
        match: score,
      }),
    },
  ];
  const res = await callAI(messages);
  return res.choices?.[0]?.message?.content ?? "";
}

async function log(userId: string, action: string, reason: string, jobId?: string, metadata?: Record<string, unknown>) {
  await admin.from("ai_agent_logs").insert({ user_id: userId, action, reason, job_id: jobId ?? null, metadata: metadata ?? {} });
}

async function runForUser(userId: string, opts: { limit?: number } = {}) {
  const ctx = await getProfileContext(userId);
  if (!ctx.cv) {
    await log(userId, "skipped_run", "No CV uploaded");
    return { scanned: 0, matched: 0, applied: 0, drafted: 0, reason: "no_cv" };
  }
  const settings = ctx.settings ?? {
    auto_apply_enabled: false,
    minimum_match_score: 80,
    daily_application_limit: 10,
    excluded_companies: [],
    excluded_keywords: [],
    require_user_approval: false,
  };

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
  const { data: jobs = [] } = await admin
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .gte("created_at", since)
    .limit(opts.limit ?? 25);

  const { data: existing = [] } = await admin
    .from("ai_job_matches")
    .select("job_id")
    .eq("user_id", userId);
  const seen = new Set(existing.map((m: { job_id: string }) => m.job_id));

  // Today's auto-applied count
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { count: appliedToday = 0 } = await admin
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("worker_id", userId)
    .eq("is_auto_applied", true)
    .gte("created_at", today.toISOString());

  let scanned = 0, matched = 0, drafted = 0, applied = appliedToday ?? 0;
  const startApplied = applied;

  for (const job of jobs) {
    if (seen.has(job.id)) continue;
    scanned++;

    // Hard filters
    const text = `${job.title} ${job.description ?? ""} ${job.company_name ?? ""}`.toLowerCase();
    const excludedCompany = (settings.excluded_companies ?? []).some((c: string) =>
      (job.company_name ?? "").toLowerCase().includes(c.toLowerCase())
    );
    const excludedKw = (settings.excluded_keywords ?? []).some((k: string) => text.includes(k.toLowerCase()));
    if (excludedCompany || excludedKw) {
      await log(userId, "skipped_job", "Excluded by user filters", job.id);
      continue;
    }

    let s;
    try {
      s = await scoreJob(ctx, job);
    } catch (e) {
      await log(userId, "error", `Scoring failed: ${e instanceof Error ? e.message : e}`, job.id);
      continue;
    }

    let status: string = "matched";
    if (s.score < 50) status = "skipped";
    else if (s.score < settings.minimum_match_score) status = "needs_review";
    else status = "matched";

    matched++;

    // Save match
    const { data: matchRow } = await admin
      .from("ai_job_matches")
      .insert({
        user_id: userId,
        job_id: job.id,
        score: s.score,
        explanation: s.explanation,
        strengths: s.strengths ?? [],
        gaps: s.gaps ?? [],
        status,
      })
      .select()
      .single();

    await log(userId, "scored_job", s.explanation, job.id, { score: s.score });

    // Auto-apply gate
    if (
      settings.auto_apply_enabled &&
      !settings.require_user_approval &&
      s.score >= settings.minimum_match_score &&
      applied < settings.daily_application_limit
    ) {
      try {
        const cover = await draftCoverLetter(ctx, job, s);
        const { data: draft } = await admin
          .from("ai_application_drafts")
          .insert({ user_id: userId, job_id: job.id, match_id: matchRow?.id, cover_letter: cover, submitted: true })
          .select()
          .single();
        drafted++;

        // Insert application
        const { error: appErr } = await admin.from("applications").insert({
          worker_id: userId,
          job_id: job.id,
          status: "applied",
          cover_letter: cover,
          is_auto_applied: true,
          cover_letter_ai: true,
          match_score: s.score,
        });
        if (appErr) throw appErr;

        await admin.from("ai_job_matches").update({ status: "auto_applied" }).eq("id", matchRow?.id);
        applied++;
        await log(userId, "auto_applied", `Match ${s.score}% — applied automatically`, job.id, { draft_id: draft?.id });
      } catch (e) {
        await log(userId, "error", `Auto-apply failed: ${e instanceof Error ? e.message : e}`, job.id);
      }
    } else if (s.score >= settings.minimum_match_score) {
      // Draft only for review
      try {
        const cover = await draftCoverLetter(ctx, job, s);
        await admin
          .from("ai_application_drafts")
          .insert({ user_id: userId, job_id: job.id, match_id: matchRow?.id, cover_letter: cover, submitted: false });
        await admin.from("ai_job_matches").update({ status: "drafted" }).eq("id", matchRow?.id);
        drafted++;
        await log(userId, "drafted", "Draft ready for review", job.id);
      } catch (e) {
        await log(userId, "error", `Draft failed: ${e instanceof Error ? e.message : e}`, job.id);
      }
    }
  }

  await admin.from("ai_agent_settings").update({ last_run_at: new Date().toISOString() }).eq("user_id", userId);

  return { scanned, matched, drafted, applied: applied - startApplied };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "run_user";
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (action === "run_all") {
      // Cron entrypoint - no user required, uses service key
      const { data: settings = [] } = await admin
        .from("ai_agent_settings")
        .select("user_id")
        .eq("auto_apply_enabled", true);
      const results: Record<string, unknown>[] = [];
      for (const s of settings) {
        try {
          results.push({ user_id: s.user_id, ...(await runForUser(s.user_id, { limit: 15 })) });
        } catch (e) {
          results.push({ user_id: s.user_id, error: String(e) });
        }
      }
      return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "run_user") {
      const r = await runForUser(user.id, { limit: body.limit ?? 20 });
      return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "apply_draft") {
      const draftId = body.draft_id;
      const { data: draft } = await admin.from("ai_application_drafts").select("*").eq("id", draftId).eq("user_id", user.id).maybeSingle();
      if (!draft) return new Response(JSON.stringify({ error: "Draft not found" }), { status: 404, headers: corsHeaders });
      const { data: match } = await admin.from("ai_job_matches").select("*").eq("id", draft.match_id).maybeSingle();
      const { error } = await admin.from("applications").insert({
        worker_id: user.id,
        job_id: draft.job_id,
        status: "applied",
        cover_letter: draft.cover_letter,
        is_auto_applied: false,
        cover_letter_ai: true,
        match_score: match?.score ?? null,
      });
      if (error) throw error;
      await admin.from("ai_application_drafts").update({ submitted: true }).eq("id", draft.id);
      await admin.from("ai_job_matches").update({ status: "auto_applied" }).eq("id", draft.match_id);
      await log(user.id, "user_submitted_draft", "Manually approved draft", draft.job_id);
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
