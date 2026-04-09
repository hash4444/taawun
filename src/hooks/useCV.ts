import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CVPersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  linkedIn?: string;
}

export interface CVEducation {
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

export interface CVExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface CVLanguage {
  name: string;
  level: string;
}

export interface CVRecord {
  id: string;
  user_id: string;
  title: string;
  personal_info: CVPersonalInfo;
  education: CVEducation[];
  experience: CVExperience[];
  skills: string[];
  languages: CVLanguage[];
  summary: string | null;
  is_ai_generated: boolean;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useCVRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cv_records', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cv_records')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CVRecord[];
    },
    enabled: !!user,
  });
}

export function useSaveCV() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (cv: Omit<CVRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      if (!user) throw new Error('Not authenticated');

      if (cv.id) {
        const { data, error } = await supabase
          .from('cv_records')
          .update({
            title: cv.title,
            personal_info: cv.personal_info as any,
            education: cv.education as any,
            experience: cv.experience as any,
            skills: cv.skills,
            languages: cv.languages as any,
            summary: cv.summary,
            is_ai_generated: cv.is_ai_generated,
          })
          .eq('id', cv.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('cv_records')
          .insert({
            user_id: user.id,
            title: cv.title,
            personal_info: cv.personal_info as any,
            education: cv.education as any,
            experience: cv.experience as any,
            skills: cv.skills,
            languages: cv.languages as any,
            summary: cv.summary,
            is_ai_generated: cv.is_ai_generated,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv_records'] });
    },
  });
}

export function useDeleteCV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cv_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv_records'] });
    },
  });
}
