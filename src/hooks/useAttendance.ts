import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type Attendance = Database['public']['Tables']['attendance']['Row'];

export interface AttendanceWithDetails extends Attendance {
  jobs?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  } | null;
  worker_profile?: {
    id: string;
    full_name: string | null;
  } | null;
}

// Get attendance record for a specific job and worker
export function useJobAttendance(jobId: string, workerId?: string) {
  const { user } = useAuth();
  const targetWorkerId = workerId || user?.id;
  
  return useQuery({
    queryKey: ['attendance', jobId, targetWorkerId],
    queryFn: async () => {
      if (!jobId || !targetWorkerId) return null;
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('job_id', jobId)
        .eq('worker_id', targetWorkerId)
        .maybeSingle();

      if (error) throw error;
      return data as Attendance | null;
    },
    enabled: !!jobId && !!targetWorkerId,
  });
}

// Get all attendance records for a job (for business)
export function useJobAttendanceList(jobId: string) {
  return useQuery({
    queryKey: ['attendance', 'job', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('job_id', jobId);

      if (error) throw error;
      return data as Attendance[];
    },
    enabled: !!jobId,
  });
}

// Worker check-in
export function useCheckIn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ jobId, businessId }: { jobId: string; businessId: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if attendance record exists
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('job_id', jobId)
        .eq('worker_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('attendance')
          .update({ check_in_at: new Date().toISOString(), method: 'qr' })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            job_id: jobId,
            worker_id: user.id,
            business_id: businessId,
            check_in_at: new Date().toISOString(),
            method: 'qr',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', jobId] });
    },
  });
}

// Worker check-out
export function useCheckOut() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('attendance')
        .update({ check_out_at: new Date().toISOString() })
        .eq('job_id', jobId)
        .eq('worker_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', jobId] });
    },
  });
}

// Business approve attendance
export function useApproveAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          approved_by_business: true,
          approved_at: new Date().toISOString(),
        })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance', data.job_id] });
    },
  });
}

// Generate QR code data for a job
export function generateQRData(jobId: string, businessId: string, action: 'check_in' | 'check_out') {
  return JSON.stringify({
    type: 'attendance',
    action,
    jobId,
    businessId,
    timestamp: Date.now(),
  });
}

// Parse QR code data
export function parseQRData(data: string): {
  type: string;
  action: 'check_in' | 'check_out';
  jobId: string;
  businessId: string;
  timestamp: number;
} | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed.type === 'attendance' && parsed.jobId && parsed.businessId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
