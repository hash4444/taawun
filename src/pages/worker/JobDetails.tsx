import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
    MapPin, Clock, Calendar, Banknote, Building2,
    Sparkles, CheckCircle2, ChevronRight, Share2,
    Heart, MessageSquare, AlertTriangle, LightbulbIcon,
    TrendingUp, BookOpen, GraduationCap, Briefcase
} from 'lucide-react';
import { useWorkerJob, useJobMatch } from '@/hooks/useWorkerJob';
import { useApplyToJob } from '@/hooks/useApplications';
import { ApplyModal } from '@/components/jobs/ApplyModal';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function JobDetails() {
    const { jobId } = useParams<{ jobId: string }>();
    const { isRTL } = useApp();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isSaved, setIsSaved] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    const { data: job, isLoading: jobLoading } = useWorkerJob(jobId || '');
    const { data: match, isLoading: matchLoading } = useJobMatch(jobId || '');
    const applyMutation = useApplyToJob();

    const handleApply = async () => {
        if (!jobId) return;
        try {
            await applyMutation.mutateAsync(jobId);
            toast.success('Successfully applied!');
            setIsApplyModalOpen(false);
        } catch (error: any) {
            toast.error('Application failed', { description: error.message });
        }
    };

    if (jobLoading) {
        return (
            <MobileLayout header={<PageHeader title="Job Details" showBack />}>
                <div className="space-y-4 p-4 animate-pulse">
                    <div className="h-40 bg-muted rounded-2xl" />
                    <div className="h-20 bg-muted rounded-xl" />
                    <div className="h-80 bg-muted rounded-2xl" />
                </div>
            </MobileLayout>
        );
    }

    if (!job) {
        return (
            <MobileLayout header={<PageHeader title="Job Details" showBack />}>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
                    <AlertTriangle size={48} className="text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">Job Not Found</h2>
                    <p className="text-muted-foreground mb-6">The job you're looking for might have been closed or removed.</p>
                    <Button onClick={() => navigate('/worker/jobs')}>Back to Jobs</Button>
                </div>
            </MobileLayout>
        );
    }

    const renderBadge = (label: string, icon?: any) => (
        <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-secondary/50 backdrop-blur-sm border-none">
            {icon && icon}
            {label}
        </Badge>
    );

    return (
        <MobileLayout
            header={
                <PageHeader
                    title={job.title}
                    showBack
                    action={
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setIsSaved(!isSaved)}>
                                <Heart size={20} className={isSaved ? "fill-red-500 text-red-500" : ""} />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Share2 size={20} />
                            </Button>
                        </div>
                    }
                />
            }
            noPadding
        >
            {/* A) Top "Decision Zone" Header */}
            <div className="relative pt-6 px-4 pb-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {renderBadge(job.job_type || 'Full-time', <Clock size={14} />)}
                                {job.location?.toLowerCase().includes('remote') && renderBadge('Remote', <MapPin size={14} />)}
                            </div>
                            <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">{job.title}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                <Building2 size={18} className="text-primary" />
                                <span>{job.businesses?.trade_name || job.company_name}</span>
                                {job.businesses?.verification_status === 'verified' && <CheckCircle2 size={14} className="text-blue-500" />}
                            </div>
                        </div>
                        {(job.businesses?.logo_url || job.company_logo) && (
                            <div className="w-16 h-16 rounded-2xl border bg-white p-2 flex items-center justify-center shadow-sm overflow-hidden">
                                <img src={job.businesses?.logo_url || job.company_logo || ''} alt={job.businesses?.trade_name || job.company_name || ''} className="max-w-full max-h-full object-contain" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/30">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location</span>
                            <span className="text-sm font-semibold">{job.location}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/30">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Salary</span>
                            <span className="text-sm font-semibold">
                                {job.salary_min ? `${job.salary_min} - ${job.salary_max} ${job.currency || 'SAR'}` : 'Not disclosed'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground flex items-center gap-4">
                        <span>Posted {format(new Date(job.created_at), 'MMM dd')}</span>
                        {job.deadline && <span>Deadline: {format(new Date(job.deadline), 'MMM dd')}</span>}
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-8 pb-24">
                {/* B) AI Match & Insight (USP block) */}
                {matchLoading ? (
                    <Card className="border-primary/20 bg-primary/5 animate-pulse">
                        <CardContent className="p-6 h-40" />
                    </Card>
                ) : match ? (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold">Taawun AI Match</h3>
                                    <p className="text-xs text-muted-foreground">Personalized for your career goals</p>
                                </div>
                                <div className="ml-auto flex flex-col items-center">
                                    <div className="relative w-14 h-14 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/30" />
                                            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150.7} strokeDashoffset={150.7 * (1 - match.score / 100)} className="text-primary" />
                                        </svg>
                                        <span className="absolute text-sm font-bold">{match.score}%</span>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-primary mt-1">{match.label}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-background border shadow-sm">
                                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-success" />
                                        Why this matches you
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{match.explanation}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {match.strengths.map((s: string) => (
                                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-success/10 text-success font-bold uppercase tracking-wide border border-success/20">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-amber-600">
                                        <LightbulbIcon size={16} />
                                        Skill Gaps & Tips
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        {match.gaps.map((gap: string) => (
                                            <li key={gap} className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-amber-500" />
                                                <span>Work on your <span className="font-semibold text-foreground">{gap}</span> skills</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <p className="text-xs font-bold text-muted-foreground mb-1">AI ACTIONS</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" className="justify-start h-10 text-xs font-semibold rounded-xl border-primary/20 hover:bg-primary/5" onClick={() => navigate('/worker/cv/builder')}>
                                            <Sparkles size={14} className="mr-2 text-primary" />
                                            Improve my CV
                                        </Button>
                                        <Button variant="outline" size="sm" className="justify-start h-10 text-xs font-semibold rounded-xl border-primary/20 hover:bg-primary/5">
                                            <MessageSquare size={14} className="mr-2 text-primary" />
                                            Prep Interview
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed bg-muted/30">
                        <CardContent className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="text-primary" />
                            </div>
                            <h3 className="font-bold mb-1">Get Match Insights</h3>
                            <p className="text-sm text-muted-foreground mb-4">Complete your profile or upload a CV to see how well you match this role.</p>
                            <Button size="sm" onClick={() => navigate('/worker/profile')}>Complete Profile</Button>
                        </CardContent>
                    </Card>
                )}

                {/* C) Job Description (structured) */}
                <div className="space-y-6">
                    <Section title="About the role">
                        <p className="text-muted-foreground leading-relaxed">
                            {job.description}
                        </p>
                    </Section>

                    {job.skills_required?.length > 0 && (
                        <Section title="Requirements">
                            <ul className="space-y-3">
                                {job.skills_required.map((r: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-muted-foreground leading-relaxed">
                                        <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {job.description && (
                        <Section title="Details">
                            <p className="text-muted-foreground leading-relaxed">
                                {job.description}
                            </p>
                        </Section>
                    )}
                </div>

                {/* E) Career Growth (student-first) */}
                {match && (
                    <div className="space-y-6 pt-6 border-t font-header">
                        <h2 className="text-xl font-bold">Career Growth</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-5 rounded-2xl bg-secondary/20 shadow-sm border border-secondary/30">
                                <div className="flex items-center gap-3 mb-3 text-primary">
                                    <TrendingUp size={20} />
                                    <h4 className="font-bold">Next Steps</h4>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">This role often leads to successful careers as a <span className="font-bold text-foreground underline decoration-primary/30 underline-offset-4">{match.careerPath}</span>.</p>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Skills you'll develop</p>
                                    <div className="flex flex-wrap gap-2">
                                        {match.futureSkills.map((s: string) => (
                                            <span key={s} className="px-3 py-1 rounded-full bg-background border text-xs font-medium text-muted-foreground">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* D) Company Section */}
                <div className="p-6 rounded-3xl bg-secondary/10 border space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border p-2">
                            {job.businesses?.logo_url ? (
                                <img src={job.businesses.logo_url} alt={job.businesses.trade_name || ''} className="w-full h-full object-contain" />
                            ) : (
                                <Building2 className="text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold">{job.businesses?.trade_name || job.company_name}</h3>
                            <p className="text-xs text-muted-foreground">{job.businesses?.sector || 'Technology'} • {job.businesses?.size || '11-50'} employees</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{'A leading innovator in the industry.'}</p>
                    <Button variant="link" className="p-0 h-auto text-primary font-bold text-sm">
                        View Company Profile <ChevronRight size={16} />
                    </Button>
                </div>
            </div>

            {/* F) Apply Panel (conversion) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pt-4 pb-safe glass-premium border-t z-50 transition-all duration-300">
                <div className="max-w-md mx-auto flex gap-3">
                    <Button
                        className="flex-1 h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
                        onClick={() => setIsApplyModalOpen(true)}
                    >
                        Apply Now
                    </Button>
                    <Button variant="outline" className="h-14 w-14 rounded-2xl border-primary/20 group hover:border-primary/50 transition-all" onClick={() => navigate('/worker/assistant')}>
                        <Sparkles className="text-primary group-hover:scale-110 transition-transform" />
                    </Button>
                </div>
            </div>

            <ApplyModal
                open={isApplyModalOpen}
                onOpenChange={setIsApplyModalOpen}
                jobTitle={job.title}
                onApply={handleApply}
                isApplying={applyMutation.isPending}
            />
        </MobileLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4">
            <h3 className="font-bold text-lg">{title}</h3>
            {children}
        </section>
    );
}
