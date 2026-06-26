import { useState, useCallback } from 'react';
import { toast } from 'sonner';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function useChat(_threadId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (
    input: string,
    additionalPayload?: Record<string, unknown>
  ) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: additionalPayload,
        }),
      });

      if (resp.status === 429) {
        toast.error('Rate limited. Please wait a moment and try again.');
        setIsLoading(false);
        return { success: false, fullResponse: '' };
      }

      if (resp.status === 402) {
        toast.error('AI credits exhausted. Please add funds.');
        setIsLoading(false);
        return { success: false, fullResponse: '' };
      }

      if (!resp.ok || !resp.body) {
        throw new Error('Failed to send message');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          // Anthropic SSE sends "event: <type>" lines ahead of each "data: "
          // line; we only need the data payload, so non-data lines are
          // skipped (this also harmlessly skips OpenAI-style comment lines).
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            // Anthropic Messages API streaming format: text arrives via
            // content_block_delta events shaped { delta: { type: "text_delta", text } }.
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              const content = parsed.delta.text as string | undefined;
              if (content) upsertAssistant(content);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
      return {
        success: true,
        fullResponse: assistantSoFar,
        quickReplies: [],
        uiActions: [],
      };
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to send message. Please try again.');
      setIsLoading(false);
      return { success: false, fullResponse: '' };
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
