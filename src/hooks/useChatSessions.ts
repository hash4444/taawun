import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type ChatSessionRow = Database['public']['Tables']['chat_sessions']['Row'];

type Message = { role: 'user' | 'assistant'; content: string };

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  metadata: Record<string, unknown>;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export function useChatSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const fetchSessions = useCallback(async () => {
    const effectiveUserId = user?.id || 'e0af6d3d-4223-4017-b344-8a9689473d8f';
    setIsLoadingSessions(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch sessions:', error);
    } else {
      setSessions((data || []).map((s: ChatSessionRow) => ({
        ...s,
        messages: Array.isArray(s.messages) ? s.messages : [],
        metadata: s.metadata && typeof s.metadata === 'object' && !Array.isArray(s.metadata) ? s.metadata : {},
      })));
    }
    setIsLoadingSessions(false);
  }, [user?.id]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = useCallback(async (firstMessage?: Message): Promise<string | null> => {
    const effectiveUserId = user?.id || 'e0af6d3d-4223-4017-b344-8a9689473d8f';
    const messages = firstMessage ? [firstMessage] : [];
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: effectiveUserId, title: 'New Chat', messages: JSON.parse(JSON.stringify(messages)), metadata: {} })
      .select()
      .single();

    if (error || !data) {
      console.warn('Failed to create session in Supabase (likely RLS):', error);
      return null;
    }
    const session: ChatSession = {
      ...data,
      messages: Array.isArray(data.messages) ? data.messages as unknown as Message[] : [],
      metadata: data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata) ? data.metadata as Record<string, unknown> : {},
    };
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    return session.id;
  }, [user?.id]);

  const updateSessionMessages = useCallback(async (sessionId: string, messages: Message[]) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ messages: JSON.parse(JSON.stringify(messages)) })
      .eq('id', sessionId);

    if (!error) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages, updated_at: new Date().toISOString() } : s));
    }
  }, []);

  const autoTitle = useCallback(async (sessionId: string, messages: Message[]) => {
    // Generate title from first user message
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser) return;
    const title = firstUser.content.slice(0, 60).replace(/\n/g, ' ').trim() || 'New Chat';
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId);
    if (!error) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
    }
  }, []);

  const renameSession = useCallback(async (sessionId: string, title: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId);
    if (!error) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
    }
  }, []);

  const pinSession = useCallback(async (sessionId: string, pinned: boolean) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_pinned: pinned })
      .eq('id', sessionId);
    if (!error) {
      setSessions(prev => {
        const updated = prev.map(s => s.id === sessionId ? { ...s, is_pinned: pinned } : s);
        return updated.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      });
    }
  }, []);

  const archiveSession = useCallback(async (sessionId: string, archived: boolean) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_archived: archived })
      .eq('id', sessionId);
    if (!error) {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, is_archived: archived } : s));
      if (archived && activeSessionId === sessionId) setActiveSessionId(null);
    }
  }, [activeSessionId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);
    if (!error) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(null);
    }
  }, [activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    isLoadingSessions,
    createSession,
    updateSessionMessages,
    autoTitle,
    renameSession,
    pinSession,
    archiveSession,
    deleteSession,
    fetchSessions,
  };
}
