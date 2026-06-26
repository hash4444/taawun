import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, CheckCircle2, AlertCircle, Rocket } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ApplyModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobTitle: string;
    onApply: () => void;
    isApplying?: boolean;
}

export function ApplyModal({ open, onOpenChange, jobTitle, onApply, isApplying }: ApplyModalProps) {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Mock profile completeness for now
    const completeness = 85;
    const hasCv = true;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-3xl p-6 gap-6">
                <DialogHeader className="text-left">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        Apply for {jobTitle}
                    </DialogTitle>
                    <DialogDescription>
                        One last step before you submit your application.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Profile Completeness */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-muted-foreground uppercase tracking-wider text-caption">Profile Completeness</span>
                            <span className={completeness >= 80 ? "text-success" : "text-amber-500"}>{completeness}%</span>
                        </div>
                        <Progress value={completeness} className="h-2" />
                        {completeness < 100 && (
                            <p className="text-caption text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle size={12} className="text-amber-500" />
                                Add your education to reach 100% and rank higher.
                            </p>
                        )}
                    </div>

                    {/* CV Status */}
                    <div className="p-4 rounded-2xl bg-secondary/20 border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-background border shadow-sm">
                                <FileText size={18} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-card-title font-bold">{hasCv ? 'Main_Resume_2024.pdf' : 'No CV Attached'}</p>
                                <p className="text-caption text-muted-foreground uppercase font-bold tracking-tight">Standard Format</p>
                            </div>
                        </div>
                        {hasCv && <CheckCircle2 size={16} className="text-success" />}
                    </div>

                    {/* AI Optimization Trigger */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mt-1">
                                <Sparkles size={16} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-card-title font-bold mb-1">AI CV Optimizer</h4>
                                <p className="text-caption text-muted-foreground leading-relaxed mb-3">
                                    Tailor your CV bullets specifically for the <span className="font-bold text-foreground underline decoration-primary/30">{jobTitle}</span> role to increase your interview chances.
                                </p>
                                <Button variant="outline" size="sm" className="h-8 text-caption font-bold uppercase rounded-lg border-primary/20 hover:bg-primary/5" onClick={() => navigate('/worker/cv/builder')}>
                                    Optimize with AI
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button
                        className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                        onClick={onApply}
                        disabled={isApplying}
                    >
                        {isApplying ? 'Applying...' : 'Apply with Current CV'}
                    </Button>
                    {!hasCv && (
                        <Button variant="outline" className="w-full h-12 rounded-xl text-sm font-bold border-muted" onClick={() => navigate('/worker/cv/builder')}>
                            Build CV with AI
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
