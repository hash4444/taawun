import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { validatePreferences, type AvailabilityPreferences, type BusyEvent } from '@/lib/availability';
import type { ImportedBusyEvent } from '@/lib/calendar';
import type { Json } from '@/integrations/supabase/types';
export const EMPTY_AVAILABILITY: AvailabilityPreferences = { timezone: 'Asia/Dubai', weekly_windows: [], minimum_shift_minutes: 120, travel_buffer_minutes: 30, share_with_employers: false };
export interface PrivateCalendarEvent extends BusyEvent { id: string; source: string; external_uid: string }
export function useAvailabilityPreferences() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['availability_preferences', user?.id], enabled: !!user,
    queryFn: async (): Promise<AvailabilityPreferences> => {
      const [{ data, error }, connections] = await Promise.all([
        supabase.from('availability_preferences').select('*').eq('user_id', user!.id).maybeSingle(),
        supabase.from('calendar_connections').select('last_synced_at').eq('user_id', user!.id).eq('provider', 'ics').eq('status', 'connected').maybeSingle(),
      ]);
      if (error) throw error;
      if (connections.error) throw connections.error;
      const calendar_checked_until = connections.data ? (connections.data.last_synced_at ? new Date(Date.parse(connections.data.last_synced_at) + 120 * 86_400_000).toISOString() : '1970-01-01T00:00:00.000Z') : null;
      return data ? { ...data, calendar_checked_until, weekly_windows: data.weekly_windows as unknown as AvailabilityPreferences['weekly_windows'] } : { ...EMPTY_AVAILABILITY, calendar_checked_until };
    },
  });
}
export function useCalendarEvents() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['academic_calendar_events', user?.id], enabled: !!user,
    queryFn: async (): Promise<PrivateCalendarEvent[]> => {
      // Never truncate conflicts silently. An overflow blocks confirmed matching until the timetable is reduced.
      const { data, error } = await supabase.from('academic_calendar_events').select('id,source,external_uid,start_at,end_at,busy').eq('user_id', user!.id).gte('end_at', new Date().toISOString()).order('start_at').limit(2001);
      if (error) throw error;
      if ((data?.length || 0) > 2000) throw new Error('Your timetable exceeds the supported 2,000 events. Reduce the imported range before matching.');
      return data || [];
    },
  });
}
export function useSaveAvailability() {
  const { user } = useAuth(); const qc = useQueryClient();
  return useMutation({ mutationFn: async (prefs: AvailabilityPreferences) => {
    if (!user) throw new Error('Sign in to save availability.');
    validatePreferences(prefs);
    const { calendar_checked_until: _derived, ...persisted } = prefs;
    const { error } = await supabase.from('availability_preferences').upsert({ user_id: user.id, ...persisted, weekly_windows: prefs.weekly_windows as unknown as Json }, { onConflict: 'user_id' });
    if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ['availability_preferences'] }) });
}
export function useImportCalendar() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (events: ImportedBusyEvent[]) => {
    const { error } = await supabase.rpc('replace_calendar_import', { p_events: events as unknown as Json });
    if (error) throw error;
  }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ['academic_calendar_events'] }); void qc.invalidateQueries({ queryKey: ['availability_preferences'] }); } });
}
export function useAddBusyPeriod() {
  const { user } = useAuth(); const qc = useQueryClient();
  return useMutation({ mutationFn: async (period: BusyEvent) => {
    if (!user) throw new Error('Sign in to save your timetable.');
    if (!Number.isFinite(Date.parse(period.start_at)) || Date.parse(period.end_at) <= Date.parse(period.start_at)) throw new Error('End must be after start.');
    const { error } = await supabase.from('academic_calendar_events').insert({ user_id: user.id, source: 'manual', external_uid: crypto.randomUUID(), ...period });
    if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ['academic_calendar_events'] }) });
}
export function useDeleteBusyPeriod() {
  const { user } = useAuth(); const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => {
    if (!user) throw new Error('Sign in to edit your timetable.');
    const { error } = await supabase.from('academic_calendar_events').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ['academic_calendar_events'] }) });
}
export function useDisconnectCalendar() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (provider: string) => {
    const { error } = await supabase.rpc('disconnect_calendar', { p_provider: provider });
    if (error) throw error;
  }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ['academic_calendar_events'] }); void qc.invalidateQueries({ queryKey: ['availability_preferences'] }); } });
}
