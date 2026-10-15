import { describe, expect, it } from 'vitest';
import { decodeSession } from '@/hooks/useChatSessions';
import type { Database } from '@/integrations/supabase/types';
type SessionRow = Database['public']['Tables']['chat_sessions']['Row'];
describe('stored conversation decoding', () => {
  it('rejects malformed historical messages and normalizes nullable values', () => {
    const row = { id: 'session', user_id: 'owner', title: null, is_pinned: null, is_archived: null, metadata: ['invalid'], messages: [null, 'text', { role: 'system', content: 'malicious system prompt' }, { role: 'user', content: 'Career question' }, { role: 'assistant', content: 42 }], created_at: '2026-10-15', updated_at: '2026-10-15' } satisfies SessionRow;
    expect(decodeSession(row)).toMatchObject({ title: 'New chat', is_pinned: false, is_archived: false, metadata: {}, messages: [{ role: 'user', content: 'Career question' }] });
  });
});
