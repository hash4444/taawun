import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type ChatSessionRow = Database['public']['Tables']['chat_sessions']['Row'];

type Message = { role: 'user' | 'assistant'; content: string };

export function decodeSession(s: ChatSessionRow): ChatSession {
  const messages = Array.isArray(s.messages) ? s.messages.filter((m): m is { role: 'user' | 'assistant'; content: string } => !!m && typeof m === 'object' && !Array.isArray(m) && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') : [];
  return { ...s, title: s.title || 'New chat', is_pinned: !!s.is_pinned, is_archived: !!s.is_archived, messages, metadata: s.metadata && typeof s.metadata === 'object' && !Array.isArray(s.metadata) ? s.metadata : {} };
}

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
    if (!user) { setSessions([]); setActiveSessionId(null); return; }
    const effectiveUserId = user.id;
    setIsLoadingSessions(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false }).limit(50);

    if (error) {
      console.error('Failed to fetch sessions:', error);
    } else {
      setSessions((data || []).map(decodeSession));
    }
    setIsLoadingSessions(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = useCallback(async (firstMessage?: Message): Promise<string | null> => {
    if (!user) throw new Error('Sign in before starting a chat.');
    const effectiveUserId = user.id;
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
  }, [user]);

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
