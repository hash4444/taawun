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
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkerDesktopShell } from "@/components/layout/WorkerDesktopShell";
import {
  useAgentSettings, useSaveAgentSettings,
  useJobPreferences, useSaveJobPreferences,
  useJobMatches, useDrafts, useAgentLogs,
  runJobHunter, submitDraft,
  AgentSettings, JobPreferences,
} from "@/hooks/useJobHunter";
import { useCVRecords } from "@/hooks/useCV";

const JOB_TYPES = ["full-time", "part-time", "internship", "freelance", "contract"];
const WORK_MODES = ["remote", "hybrid", "on-site"];

interface JobMatchItem {
  id: string;
  job_id: string;
  score: number;
  status: string;
  explanation?: string;
  strengths?: string[];
  gaps?: string[];
  jobs?: { title?: string; company_name?: string; location?: string } | null;
}

interface DraftItem {
  id: string;
  job_id: string;
  cover_letter?: string;
  jobs?: { title?: string; company_name?: string } | null;
  ai_job_matches?: { score?: number; explanation?: string } | null;
}

interface AgentLogItem {
  id: string;
  action: string;
  reason?: string;
  created_at: string;
}

export default function JobHunterDashboard() {
  const isMobile = useIsMobile();
  const { data: settings } = useAgentSettings();
  const { data: prefs } = useJobPreferences();
  const { data: matches = [] } = useJobMatches();
  const { data: drafts = [] } = useDrafts();
  const { data: logs = [] } = useAgentLogs();
  const { data: cvs = [] } = useCVRecords();
  const saveSettings = useSaveAgentSettings();
  const savePrefs = useSaveJobPreferences();

  const [running, setRunning] = useState(false);
  const [localSettings, setLocalSettings] = useState<AgentSettings | null>(null);
  const [localPrefs, setLocalPrefs] = useState<JobPreferences | null>(null);

  const s = localSettings ?? settings;
  const p = localPrefs ?? prefs;

  const hasCV = cvs.length > 0;
  const status = !hasCV ? "needs_setup" : s?.auto_apply_enabled ? "active" : "paused";

  const typedMatches = matches as unknown as JobMatchItem[];
  const typedDrafts = drafts as unknown as DraftItem[];
  const typedLogs = logs as unknown as AgentLogItem[];

  const stats = {
    scanned: typedLogs.filter((l) => l.action === "scored_job").length,
    matched: typedMatches.length,
    applied: typedMatches.filter((m) => m.status === "auto_applied").length,
    review: typedMatches.filter((m) => m.status === "needs_review").length + typedDrafts.length,
  };

  const handleRun = async () => {
    if (!hasCV) return toast.error("Upload or create a CV first");
    setRunning(true);
    try {
      const r = await runJobHunter();
      toast.success(`Scanned ${r.scanned}, matched ${r.matched}, applied ${r.applied}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const toggleArr = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const statusBadge = (
    <Badge variant={status === "active" ? "default" : status === "paused" ? "secondary" : "destructive"} className="text-caption py-1 px-2.5 whitespace-nowrap">
      {status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === "paused" && <Shield className="h-3 w-3 mr-1" />}
      {status === "needs_setup" && <AlertCircle className="h-3 w-3 mr-1" />}
      {status === "active" ? "Active" : status === "paused" ? "Paused" : "Needs Setup"}
    </Badge>
  );

  const runButton = (
    <Button onClick={handleRun} disabled={running} className="w-full">
      {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      Run now
    </Button>
  );

  const noCvCard = !hasCV && (
    <Card className="border-warning bg-warning/5">
      <CardContent className="pt-6 flex flex-col items-start gap-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">No CV found</p>
            <p className="text-body text-muted-foreground">Upload or create a CV to enable AI matching and auto-apply.</p>
          </div>
        </div>
        <Button variant="outline" className="w-full" asChild><a href="/worker/cv">Go to CV Center</a></Button>
      </CardContent>
    </Card>
  );

  const statCards = (gridCols: string) => (
    <div className={`grid ${gridCols} gap-3`}>
      <StatCard icon={<Zap className="h-4 w-4" />} label="Scanned" value={stats.scanned} />
      <StatCard icon={<Sparkles className="h-4 w-4" />} label="Matched" value={stats.matched} />
      <StatCard icon={<Send className="h-4 w-4" />} label="Auto-applied" value={stats.applied} />
      <StatCard icon={<FileText className="h-4 w-4" />} label="Needs review" value={stats.review} />
    </div>
  );

  const tabsSection = (
      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="review">Review ({stats.review})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-3">
          {typedMatches.length === 0 && <EmptyState text='No matches yet — press "Run now" to scan jobs.' />}
          {typedMatches.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-card-title truncate">{m.jobs?.title ?? "Job"}</h3>
                    <p className="text-caption text-muted-foreground truncate">{m.jobs?.company_name} • {m.jobs?.location}</p>
                  </div>
                  <ScoreBadge score={m.score} />
                </div>
                <Progress value={m.score} className="h-1.5" />
                <p className="text-body">{m.explanation}</p>
                {m.strengths?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.strengths.slice(0, 4).map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-caption">+ {s}</Badge>
                    ))}
                    {m.gaps?.slice(0, 2).map((g: string, i: number) => (
                      <Badge key={`g${i}`} variant="outline" className="text-caption">− {g}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-caption capitalize">{m.status.replace("_", " ")}</Badge>
                  <Button size="sm" variant="ghost" asChild><a href={`/worker/job-details/${m.job_id}`}>View job →</a></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="review" className="space-y-3">
          {typedDrafts.length === 0 && <EmptyState text="No drafts to review." />}
          {typedDrafts.map((d) => (
            <Card key={d.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-card-title truncate">{d.jobs?.title}</h3>
                    <p className="text-caption text-muted-foreground truncate">{d.jobs?.company_name}</p>
                  </div>
                  {d.ai_job_matches?.score && <ScoreBadge score={d.ai_job_matches.score} />}
                </div>
                <div className="bg-muted/40 rounded-md p-3 text-body whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {d.cover_letter}
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" asChild><a href={`/worker/job-details/${d.job_id}`}>View job</a></Button>
                  <Button size="sm" onClick={async () => {
                    try { await submitDraft(d.id); toast.success("Application submitted"); }
                    catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); }
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
          {typedLogs.length === 0 && <EmptyState text="No activity yet." />}
          {typedLogs.map((l) => (
            <Card key={l.id}>
              <CardContent className="py-3 flex items-start gap-3">
                <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-card-title font-medium capitalize">{l.action.replace(/_/g, " ")}</p>
                  <p className="text-caption text-muted-foreground line-clamp-2">{l.reason}</p>
                </div>
                <span className="text-caption text-muted-foreground whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-page-title text-foreground">AI Job Hunter</h1>
              <p className="text-body text-muted-foreground mt-1">
                Your personal career manager — scans, matches, and applies for you.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {statusBadge}
              <div className="w-40">{runButton}</div>
            </div>
          </div>

          {noCvCard}

          {statCards('grid-cols-4')}

          {tabsSection}
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout footer={<BottomNav />} noPadding>
      <PageHeader
        title="AI Job Hunter"
        subtitle="Your personal career manager — scans, matches, and applies for you."
        showBack
        action={statusBadge}
      />

      <div className="px-4 space-y-4 pb-4">
        {runButton}

        {noCvCard}

        {statCards('grid-cols-2')}

        {tabsSection}
      </div>
    </MobileLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-caption">{icon}<span>{label}</span></div>
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
