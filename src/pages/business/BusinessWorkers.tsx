import { useApp } from '@/contexts/AppContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Star, Clock, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function BusinessWorkers() {
  const { t, isRTL } = useApp();
  const { user } = useAuth();

  // Fetch workers who have worked with this business
  const { data: workerData, isLoading } = useQuery({
    queryKey: ['business-workers', user?.id],
    queryFn: async () => {
      if (!user) return { active: [], past: [] };

      // Get all applications for this business's jobs that are accepted or completed
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('poster_id', user.id);

      if (!jobs || jobs.length === 0) return { active: [], past: [] };

      const jobIds = jobs.map(j => j.id);

      const { data: applications } = await supabase
        .from('applications')
        .select(`
          *,
          workers!applications_worker_id_fkey (
            id,
            rating_avg,
            rating_count
          ),
          jobs (
            id,
            title,
            status
          )
        `)
        .in('job_id', jobIds)
        .in('status', ['accepted', 'completed']);

      if (!applications) return { active: [], past: [] };

      // Get worker profiles
      const workerIds = [...new Set(applications.map(a => a.worker_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', workerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Group workers
      const workerStats = new Map<string, {
        id: string;
        name: string;
        rating: number;
        jobsCompleted: number;
        isActive: boolean;
      }>();

      applications.forEach(app => {
        const existing = workerStats.get(app.worker_id);
        const profile = profileMap.get(app.worker_id);
        const workerInfo = app.workers as any;

        if (existing) {
          if (app.status === 'completed') {
            existing.jobsCompleted++;
          }
          if (app.jobs?.status === 'in_progress' || app.jobs?.status === 'open' || app.jobs?.status === 'filled') {
            existing.isActive = true;
          }
        } else {
          workerStats.set(app.worker_id, {
            id: app.worker_id,
            name: profile?.full_name || (isRTL ? 'عامل' : 'Worker'),
            rating: workerInfo?.rating_avg || 0,
            jobsCompleted: app.status === 'completed' ? 1 : 0,
            isActive: app.jobs?.status === 'in_progress' || app.jobs?.status === 'open' || app.jobs?.status === 'filled',
          });
        }
      });

      const allWorkers = Array.from(workerStats.values());
      return {
        active: allWorkers.filter(w => w.isActive),
        past: allWorkers.filter(w => !w.isActive && w.jobsCompleted > 0),
      };
    },
    enabled: !!user,
  });

  const workers = workerData || { active: [], past: [] };

  const renderWorkerCard = (worker: { id: string; name: string; rating: number; jobsCompleted: number }) => (
    <div key={worker.id} className="card-elevated p-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
          <User size={24} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground">{worker.name}</h3>
        </div>
        <div className="text-end">
          {worker.rating > 0 && (
            <div className="flex items-center gap-1 justify-end">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{worker.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <CheckCircle2 size={12} />
            <span>{worker.jobsCompleted} {isRTL ? 'وظائف' : 'jobs'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MobileLayout
      header={
        <PageHeader 
          title={t('workerManagement')} 
          showBack 
          backPath="/business/profile" 
        />
      }
      noPadding
    >
      <div className="px-4 py-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card-elevated p-4 text-center">
            <Clock size={20} className="mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{workers.active.length}</p>
            <p className="text-xs text-muted-foreground">
              {t('activeWorkers')}
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <CheckCircle2 size={20} className="mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">
              {workers.active.length + workers.past.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('totalWorkers')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active">
              {isRTL ? 'نشطين' : 'Active'}
            </TabsTrigger>
            <TabsTrigger value="past">
              {isRTL ? 'سابقين' : 'Past'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : workers.active.length > 0 ? (
              workers.active.map(renderWorkerCard)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('noActiveWorkers')}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : workers.past.length > 0 ? (
              workers.past.map(renderWorkerCard)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('noPastWorkers')}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
