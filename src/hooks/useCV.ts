import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { privateCVPath } from '@/lib/cv';
import type { Json } from '@/integrations/supabase/types';

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
      const filePath = cv.file_url ? privateCVPath(cv.file_url, user.id) : null;

      if (cv.id) {
        const { data, error } = await supabase
          .from('cv_records')
          .update({
            title: cv.title,
            personal_info: cv.personal_info as unknown as Json,
            education: cv.education as unknown as Json,
            experience: cv.experience as unknown as Json,
            skills: cv.skills,
            languages: cv.languages as unknown as Json,
            summary: cv.summary,
            is_ai_generated: cv.is_ai_generated,
            file_url: filePath,
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
            personal_info: cv.personal_info as unknown as Json,
            education: cv.education as unknown as Json,
            experience: cv.experience as unknown as Json,
            skills: cv.skills,
            languages: cv.languages as unknown as Json,
            summary: cv.summary,
            is_ai_generated: cv.is_ai_generated,
            file_url: filePath,
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
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Sign in to delete your CV.');
      const { data: cv, error: readError } = await supabase.from('cv_records').select('id,user_id,file_url').eq('id', id).eq('user_id', user.id).single();
      if (readError) throw readError;
      if (!cv || cv.user_id !== user.id) throw new Error('This CV does not belong to your account.');
      if (cv.file_url) {
        const path = privateCVPath(cv.file_url, user.id);
        // Remove the file first. On database failure the record remains available for a safe retry.
        const { error: storageError } = await supabase.storage.from('cv_files').remove([path]);
        if (storageError) throw new Error('Could not remove the private file. Your CV record was kept; please retry.');
      }
      const { error } = await supabase.from('cv_records').delete().eq('id', id).eq('user_id', user.id).select('id').single();
      if (error) throw new Error(cv.file_url ? 'The file was removed, but its CV record could not be deleted. Retry to finish deletion.' : error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cv_records'] }),
  });
}
