import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { BusinessDesktopShell } from "@/components/layout/BusinessDesktopShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Sparkles, Send } from "lucide-react";
import {
  useCandidateHunterSettings,
  useSaveCandidateHunterSettings,
  useCandidateMatches,
  useOutreachDrafts,
  runCandidateHunter,
  sendOutreachDraft,
  CandidateHunterSettings,
} from "@/hooks/useCandidateHunter";

const STATUS_BADGE: Record<string, string> = {
  matched: 'bg-info-light text-info',
  drafted: 'bg-warning-light text-warning',
  outreached: 'bg-success-light text-success',
  needs_review: 'bg-warning-light text-warning',
  skipped: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive-light text-destructive',
};

export default function CandidateHunterDashboard() {
  const isMobile = useIsMobile();
  const { data: settings } = useCandidateHunterSettings();
  const { data: matches = [] } = useCandidateMatches();
  const { data: drafts = [] } = useOutreachDrafts();
  const saveSettings = useSaveCandidateHunterSettings();

  const [localSettings, setLocalSettings] = useState<CandidateHunterSettings | null>(null);
  const [running, setRunning] = useState(false);

  const s = localSettings ?? settings;

  const handleRun = async () => {
    setRunning(true);
    try {
      const r = await runCandidateHunter();
      toast.success(`Scanned ${r.scanned}, matched ${r.matched}, outreached ${r.outreached}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!s) return;
    try {
      await saveSettings.mutateAsync(s);
      toast.success("Candidate Hunter settings saved!");
      setLocalSettings(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSendDraft = async (draftId: string) => {
    try {
      await sendOutreachDraft(draftId);
      toast.success("Outreach sent");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const settingsCard = (
    <Card>
      <CardHeader>
        <CardTitle>Core Settings</CardTitle>
        <CardDescription>Configure recruitment automation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-base">AI Mode</Label>
              <p className="text-body text-muted-foreground">Select how AI operates</p>
            </div>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background max-w-[140px]"
              value={s?.mode ?? "MANUAL"}
              onChange={(e) => setLocalSettings({ ...(s as CandidateHunterSettings), mode: e.target.value as CandidateHunterSettings["mode"] })}
            >
              <option value="MANUAL">Manual</option>
              <option value="APPROVAL">Approval</option>
              <option value="AUTO">Auto-Outreach</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Required Match Score (%)</Label>
            <Input
              type="number"
              min={50}
              max={100}
              value={s?.minimum_match_score ?? 80}
              onChange={(e) => setLocalSettings({ ...(s as CandidateHunterSettings), minimum_match_score: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Daily Outreach</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={s?.daily_outreach_limit ?? 10}
              onChange={(e) => setLocalSettings({ ...(s as CandidateHunterSettings), daily_outreach_limit: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Roles (comma separated)</Label>
            <Input
              value={(s?.target_roles ?? []).join(", ")}
              onChange={(e) => setLocalSettings({ ...(s as CandidateHunterSettings), target_roles: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Excluded Keywords (comma separated)</Label>
            <Input
              value={(s?.excluded_keywords ?? []).join(", ")}
              onChange={(e) => setLocalSettings({ ...(s as CandidateHunterSettings), excluded_keywords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleSaveSettings} disabled={saveSettings.isPending}>
          {saveSettings.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );

  const activityCard = (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Matches</CardTitle>
        <CardDescription>Workers the AI has scored against your open jobs</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-body text-muted-foreground text-center py-8">
            No matches yet — press "Run now" to scan candidates against your open jobs.
          </p>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg transition-all hover:bg-muted/50">
                <div className="min-w-0">
                  <h4 className="font-semibold truncate">{m.candidate_name ?? "Candidate"}</h4>
                  <p className="text-body text-muted-foreground truncate">
                    Role: {m.job_title ?? "Job"} • Match: {m.score}%
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2 py-1 text-caption font-semibold rounded-full capitalize ${STATUS_BADGE[m.status] ?? ''}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {drafts.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-semibold text-body">Outreach drafts awaiting your approval</h4>
            {drafts.map((d) => (
              <div key={d.id} className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-body font-medium">{d.job_title ?? "Job"}</p>
                  <Button size="sm" onClick={() => handleSendDraft(d.id)}>
                    <Send size={14} className="me-1.5" /> Send
                  </Button>
                </div>
                <p className="text-body text-muted-foreground whitespace-pre-wrap">{d.outreach_message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const runButton = (
    <Button onClick={handleRun} disabled={running}>
      {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
      Run now
    </Button>
  );

  if (!isMobile) {
    return (
      <BusinessDesktopShell>
        <div className="space-y-6 max-w-6xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-page-title text-foreground">AI Candidate Hunter</h1>
              <p className="text-body text-muted-foreground mt-1">
                Let AI find, vet, and reach out to the best candidates for your open roles.
              </p>
            </div>
            {runButton}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">{settingsCard}</div>
            <div className="col-span-1 md:col-span-2">{activityCard}</div>
          </div>
        </div>
      </BusinessDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={<PageHeader title="AI Candidate Hunter" subtitle="AI-sourced candidates for your roles" showBack action={runButton} />}
      footer={<BottomNav />}
    >
      <div className="space-y-4">
        {settingsCard}
        {activityCard}
      </div>
    </MobileLayout>
  );
}
