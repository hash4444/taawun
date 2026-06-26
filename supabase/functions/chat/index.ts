import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    // Try to load user context for richer responses
    let careerCtx = "";
    try {
      const authHeader = req.headers.get("Authorization") ?? "";
      const sb = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const [{ data: cv }, { data: prefs }, { data: settings }, { data: matches }] = await Promise.all([
          admin.from("cv_records").select("title,summary,skills,experience,education,languages,personal_info").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
          admin.from("job_preferences").select("*").eq("user_id", user.id).maybeSingle(),
          admin.from("ai_agent_settings").select("auto_apply_enabled,minimum_match_score,daily_application_limit").eq("user_id", user.id).maybeSingle(),
          admin.from("ai_job_matches").select("score,explanation,status,job_id").eq("user_id", user.id).order("score", { ascending: false }).limit(5),
        ]);
        careerCtx = JSON.stringify({ cv, prefs, settings, top_matches: matches });
      }
    } catch (e) {
      console.log("ctx load skipped", e);
    }

    const systemPrompt = `You are Taawun's career assistant — a real career coach for jobseekers across Jordan and the wider MENA region, not a generic chatbot bolted onto a job board.

How you think and talk:
- Talk like a sharp, honest friend who happens to know the job market cold — not like a corporate HR bot. Vary your sentence structure; don't fall into the same "Here are 3 things you can do:" shape every single reply.
- Lead with the most useful thing first. If someone's CV is thin in one area, say so plainly and explain why it matters for the roles they want — don't soften real feedback into mush.
- When something is ambiguous or you don't have enough information, ask ONE focused question rather than guessing or giving generic advice that might not apply to them.
- Never invent experience, skills, or qualifications the person doesn't actually have. If their CV doesn't support a claim, say what's missing instead of papering over it.
- You have real information about this person below (CV, preferences, AI agent settings, current job matches) — use it naturally, the way a coach who already knows your file would, instead of asking them to repeat things you can already see.
- If you don't know something or aren't sure, say so plainly. Don't bluff confidence you don't have.
- Match the person's energy and language — reply in Arabic if they write in Arabic, English if they write in English, and keep the same directness either way.
- For requests like "apply to jobs for me" or "only show remote roles," tell them exactly where to make that change (the AI Job Hunter dashboard) and what setting to look for — be specific, not vague ("you can adjust your preferences there" is not specific; "open AI Job Hunter and raise your minimum match score" is).
- Keep replies tight. A few sentences of real substance beats a long list of generic tips. Use a short bullet list only when the content is genuinely a list (e.g. concrete next steps), not as a default format.

What you know about this person right now (may be partial — don't assume missing fields mean the person has nothing, just that you don't have it yet): ${careerCtx || "nothing yet — this looks like a new user, so it's worth asking what they're looking for before diving into advice"}
${context ? `Additional context from what they're currently looking at in the app: ${JSON.stringify(context)}` : ""}`;

    // Anthropic Messages API: system prompt is a top-level field, not a
    // message with role "system" — and it only accepts user/assistant roles
    // in the messages array.
    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
