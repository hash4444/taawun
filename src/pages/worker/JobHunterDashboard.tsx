import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Sparkles, Bot, AlertCircle, CheckCircle2, FileText, Zap, Shield, Send } from "lucide-react";
import {
  useAgentSettings, useSaveAgentSettings,
  useJobPreferences, useSaveJobPreferences,
  useJobMatches, useDrafts, useAgentLogs,
  runJobHunter, submitDraft,
} from "@/hooks/useJobHunter";
import { useCVRecords } from "@/hooks/useCV";

const JOB_TYPES = ["full-time", "part-time", "internship", "freelance", "contract"];
const WORK_MODES = ["remote", "hybrid", "on-site"];

export default function JobHunterDashboard() {
  const { data: settings } = useAgentSettings();
  const { data: prefs } = useJobPreferences();
  const { data: matches = [] } = useJobMatches();
  const { data: drafts = [] } = useDrafts();
  const { data: logs = [] } = useAgentLogs();
  const { data: cvs = [] } = useCVRecords();
  const saveSettings = useSaveAgentSettings();
  const savePrefs = useSaveJobPreferences();

  const [running, setRunning] = useState(false);
  const [localSettings, setLocalSettings] = useState<any>(null);
  const [localPrefs, setLocalPrefs] = useState<any>(null);

  const s = localSettings ?? settings;
  const p = localPrefs ?? prefs;

  const hasCV = cvs.length > 0;
  const status = !hasCV ? "needs_setup" : s?.auto_apply_enabled ? "active" : "paused";

  const stats = {
    scanned: logs.filter((l: any) => l.action === "scored_job").length,
    matched: matches.length,
    applied: matches.filter((m: any) => m.status === "auto_applied").length,
    review: matches.filter((m: any) => m.status === "needs_review").length + drafts.length,
  };

  const handleRun = async () => {
    if (!hasCV) return toast.error("Upload or create a CV first");
    setRunning(true);
    try {
      const r = await runJobHunter();
      toast.success(`Scanned ${r.scanned}, matched ${r.matched}, applied ${r.applied}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" /> AI Job Hunter
          </h1>
          <p className="text-muted-foreground mt-1">Your personal career manager — scans, matches, and applies for you.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={status === "active" ? "default" : status === "paused" ? "secondary" : "destructive"} className="text-sm py-1.5 px-3">
            {status === "active" && <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
            {status === "paused" && <Shield className="h-3.5 w-3.5 mr-1.5" />}
            {status === "needs_setup" && <AlertCircle className="h-3.5 w-3.5 mr-1.5" />}
            {status === "active" ? "Active" : status === "paused" ? "Paused" : "Needs Setup"}
          </Badge>
          <Button onClick={handleRun} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Run now
          </Button>
        </div>
      </div>

      {!hasCV && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="font-medium">No CV found</p>
              <p className="text-sm text-muted-foreground">Upload or create a CV to enable AI matching and auto-apply.</p>
            </div>
            <Button variant="outline" asChild><a href="/worker/cv">Go to CV Center</a></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Zap className="h-4 w-4" />} label="Scanned" value={stats.scanned} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Matched" value={stats.matched} />
        <StatCard icon={<Send className="h-4 w-4" />} label="Auto-applied" value={stats.applied} />
        <StatCard icon={<FileText className="h-4 w-4" />} label="Needs review" value={stats.review} />
      </div>

      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="review">Review ({stats.review})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-3">
          {matches.length === 0 && <EmptyState text='No matches yet — press "Run now" to scan jobs.' />}
          {matches.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{m.jobs?.title ?? "Job"}</h3>
                    <p className="text-sm text-muted-foreground truncate">{m.jobs?.company_name} • {m.jobs?.location}</p>
                  </div>
                  <ScoreBadge score={m.score} />
                </div>
                <Progress value={m.score} className="h-1.5" />
                <p className="text-sm">{m.explanation}</p>
                {m.strengths?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.strengths.slice(0, 4).map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">+ {s}</Badge>
                    ))}
                    {m.gaps?.slice(0, 2).map((g: string, i: number) => (
                      <Badge key={`g${i}`} variant="outline" className="text-xs">− {g}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">{m.status.replace("_", " ")}</Badge>
                  <Button size="sm" variant="ghost" asChild><a href={`/worker/jobs/${m.job_id}`}>View job →</a></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="review" className="space-y-3">
          {drafts.length === 0 && <EmptyState text="No drafts to review." />}
          {drafts.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{d.jobs?.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{d.jobs?.company_name}</p>
                  </div>
                  {d.ai_job_matches?.score && <ScoreBadge score={d.ai_job_matches.score} />}
                </div>
                <div className="bg-muted/40 rounded-md p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {d.cover_letter}
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" asChild><a href={`/worker/jobs/${d.job_id}`}>View job</a></Button>
                  <Button size="sm" onClick={async () => {
                    try { await submitDraft(d.id); toast.success("Application submitted"); }
                    catch (e: any) { toast.error(e.message); }
                  }}>
                    <Send className="h-4 w-4 mr-1.5" /> Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto Apply</CardTitle>
              <CardDescription>The AI will only apply when these safety rules pass.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Auto Apply</Label>
                  <p className="text-sm text-muted-foreground">AI applies on your behalf to strong matches.</p>
                </div>
                <Switch checked={s?.auto_apply_enabled ?? false} onCheckedChange={(v) => setLocalSettings({ ...s, auto_apply_enabled: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require my approval</Label>
                  <p className="text-sm text-muted-foreground">Always send to Review instead of auto-submitting.</p>
                </div>
                <Switch checked={s?.require_user_approval ?? false} onCheckedChange={(v) => setLocalSettings({ ...s, require_user_approval: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Minimum match score (%)</Label>
                  <Input type="number" min={50} max={100} value={s?.minimum_match_score ?? 80}
                    onChange={(e) => setLocalSettings({ ...s, minimum_match_score: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Daily application limit</Label>
                  <Input type="number" min={1} max={50} value={s?.daily_application_limit ?? 10}
                    onChange={(e) => setLocalSettings({ ...s, daily_application_limit: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Excluded companies (comma separated)</Label>
                <Input value={(s?.excluded_companies ?? []).join(", ")}
                  onChange={(e) => setLocalSettings({ ...s, excluded_companies: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Excluded keywords (comma separated)</Label>
                <Input value={(s?.excluded_keywords ?? []).join(", ")}
                  onChange={(e) => setLocalSettings({ ...s, excluded_keywords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
              </div>
              <Button onClick={async () => { await saveSettings.mutateAsync(s); toast.success("Settings saved"); setLocalSettings(null); }}>
                Save settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>Tells the AI what kinds of jobs to look for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Job types</Label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map((t) => (
                    <Badge key={t} variant={p?.job_types?.includes(t) ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => setLocalPrefs({ ...p, job_types: toggleArr(p?.job_types ?? [], t) })}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Work mode</Label>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODES.map((t) => (
                    <Badge key={t} variant={p?.work_modes?.includes(t) ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => setLocalPrefs({ ...p, work_modes: toggleArr(p?.work_modes ?? [], t) })}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred locations (comma separated)</Label>
                <Input value={(p?.locations ?? []).join(", ")}
                  onChange={(e) => setLocalPrefs({ ...p, locations: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                  placeholder="Riyadh, Dubai, Cairo, Remote" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Minimum salary</Label>
                  <Input type="number" value={p?.salary_min ?? ""}
                    onChange={(e) => setLocalPrefs({ ...p, salary_min: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input value={p?.salary_currency ?? "SAR"}
                    onChange={(e) => setLocalPrefs({ ...p, salary_currency: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Industries (comma separated)</Label>
                <Input value={(p?.industries ?? []).join(", ")}
                  onChange={(e) => setLocalPrefs({ ...p, industries: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Career goal</Label>
                <Input value={p?.career_goal ?? ""}
                  onChange={(e) => setLocalPrefs({ ...p, career_goal: e.target.value })}
                  placeholder="e.g. Become a senior frontend engineer in 2 years" />
              </div>
              <Button onClick={async () => { await savePrefs.mutateAsync(p); toast.success("Preferences saved"); setLocalPrefs(null); }}>
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-2">
          {logs.length === 0 && <EmptyState text="No activity yet." />}
          {logs.map((l: any) => (
            <Card key={l.id}>
              <CardContent className="py-3 flex items-start gap-3">
                <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{l.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{l.reason}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}<span>{label}</span></div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "bg-success text-success-foreground" : score >= 70 ? "bg-primary text-primary-foreground" : score >= 50 ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground";
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>{score}%</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{text}</CardContent></Card>
  );
}
