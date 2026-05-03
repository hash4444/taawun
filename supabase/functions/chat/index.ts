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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const systemPrompt = `You are Taawun Career Assistant — a personal career manager and job-hunting agent for workers across MENA and Africa.

Behavior rules:
- Act like a real career coach, not a chatbot. Be specific, proactive, and honest.
- Use the user's CV, preferences, and AI matches when responding.
- If info is missing, ask ONE focused follow-up question instead of guessing.
- Never invent experience or skills.
- Support both English and Arabic; reply in the user's language.
- For requests like "apply to jobs for me", "pause auto apply", "only remote", explain the user can toggle these in their AI Job Hunter dashboard, and offer concrete next steps.
- Keep responses concise and actionable. Use short bullet lists when helpful.

User career context (may be partial): ${careerCtx || "none"}
${context ? `Additional UI context: ${JSON.stringify(context)}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
