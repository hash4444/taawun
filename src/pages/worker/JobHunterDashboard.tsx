import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const mockSettings = {
  mode: "MANUAL",
  preferences: {
    targetRoles: ["Software Engineer", "Frontend Developer"],
    locations: ["Remote", "London"],
    matchThreshold: 80,
    maxApplicationsPerDay: 5,
  }
};

const mockActivity = [
  { id: 1, type: "SUGGESTED", jobTitle: "Senior Frontend Engineer", company: "TechCorp", score: 92, date: "2026-03-26" },
  { id: 2, type: "QUEUED", jobTitle: "React Developer", company: "StartUp Inc", score: 85, date: "2026-03-26" },
  { id: 3, type: "APPLIED", jobTitle: "Fullstack Developer", company: "GlobalCorp", score: 88, date: "2026-03-25" }
];

export default function JobHunterDashboard() {
  const [settings, setSettings] = useState(mockSettings);
  const [loading, setLoading] = useState(false);

  // In a real app, we would fetch from /api/job-hunter/settings
  useEffect(() => {
    // Fetch settings on mount
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    // await api.put('/job-hunter/settings', settings);
    setTimeout(() => {
      setLoading(false);
      toast.success("Job Hunter settings saved!");
    }, 500);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Job Hunter</h1>
        <p className="text-muted-foreground mt-2">
          Let AI find, tailor, and apply to jobs for you automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle>Core Settings</CardTitle>
            <CardDescription>Configure how the AI acts on your behalf</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="space-y-0.5">
                  <Label className="text-base">AI Mode</Label>
                  <p className="text-sm text-muted-foreground">Choose autonomy level</p>
                </div>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background max-w-[120px]"
                  value={settings.mode}
                  onChange={(e) => setSettings({...settings, mode: e.target.value})}
                >
                  <option value="MANUAL">Manual</option>
                  <option value="APPROVAL">Approval</option>
                  <option value="AUTO">Auto-Apply</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Minimum Match Score (%)</Label>
                <Input 
                  type="number" 
                  value={settings.preferences.matchThreshold}
                  onChange={(e) => setSettings({
                    ...settings, 
                    preferences: {...settings.preferences, matchThreshold: Number(e.target.value)}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Applications Per Day</Label>
                <Input 
                  type="number" 
                  value={settings.preferences.maxApplicationsPerDay}
                  onChange={(e) => setSettings({
                    ...settings, 
                    preferences: {...settings.preferences, maxApplicationsPerDay: Number(e.target.value)}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Roles (comma separated)</Label>
                <Input 
                  value={settings.preferences.targetRoles.join(", ")}
                  onChange={(e) => setSettings({
                    ...settings, 
                    preferences: {...settings.preferences, targetRoles: e.target.value.split(", ")}
                  })}
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleSaveSettings} disabled={loading}>
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>What your AI has been doing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivity.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-4 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer">
                  <div>
                    <h4 className="font-semibold">{act.jobTitle}</h4>
                    <p className="text-sm text-muted-foreground">{act.company} • Match: {act.score}%</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${act.type === 'SUGGESTED' ? 'bg-blue-100 text-blue-800' : ''}
                      ${act.type === 'QUEUED' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${act.type === 'APPLIED' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {act.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{act.date}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {settings.mode === 'APPROVAL' && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg flex justify-between items-center border border-primary/20">
                <div>
                  <h4 className="font-semibold">Pending Approvals</h4>
                  <p className="text-sm">You have 1 job waiting for your approval before applying.</p>
                </div>
                <Button variant="default">Review Now</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
