import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JobMatchAnalysis {
    score: number;
    label: string;
    explanation: string;
    strengths: string[];
    gaps: string[];
    improvements: string[];
    careerPath: string;
    futureSkills: string[];
}

export function useWorkerJob(jobId: string) {
    return useQuery({
        queryKey: ['worker-job', jobId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    businesses (
                        id,
                        trade_name,
                        legal_name,
                        sector,
                        rating_avg,
                        rating_count
                    )
                `)
                .eq('id', jobId)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!jobId,
    });
}

export function useJobMatch(_jobId: string) {
    // Job matching will be implemented via an edge function later
    return useQuery({
        queryKey: ['job-match', _jobId],
        queryFn: async (): Promise<JobMatchAnalysis> => {
            return {
                score: 0,
                label: 'Not available',
                explanation: 'Job matching is being set up.',
                strengths: [],
                gaps: [],
                improvements: [],
                careerPath: '',
                futureSkills: [],
            };
        },
        enabled: false,
    });
}
