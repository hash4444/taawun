import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/jobs/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Job not found');
            return res.json();
        },
        enabled: !!jobId,
    });
}

export function useJobMatch(jobId: string) {
    return useQuery({
        queryKey: ['job-match', jobId],
        queryFn: async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/jobs/${jobId}/match`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Could not fetch match data');
            return res.json() as Promise<JobMatchAnalysis>;
        },
        enabled: !!jobId && !!localStorage.getItem('access_token'),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
