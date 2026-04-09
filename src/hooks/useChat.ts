import { useState, useCallback } from 'react';
import { toast } from 'sonner';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/assistant/chat`;

export function useChat(threadId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (
    input: string,
    additionalPayload?: Record<string, unknown>
  ) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const resp = await fetch(CHAT_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          threadId,
          ...additionalPayload
        }),
      });

      if (resp.status === 401) {
        toast.error('Unauthorized. Please login.');
        setIsLoading(false);
        return { success: false, fullResponse: '' };
      }

      if (!resp.ok) {
        throw new Error('Failed to send message');
      }

      const data = await resp.json();
      const assistantMsg = data.assistantMessage;

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
      setIsLoading(false);
      return {
        success: true,
        fullResponse: assistantMsg,
        quickReplies: data.quickReplies || [],
        uiActions: data.uiActions || []
      };

    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to send message. Please try again.');
      setIsLoading(false);
      return { success: false, fullResponse: '' };
    }
  }, [threadId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
