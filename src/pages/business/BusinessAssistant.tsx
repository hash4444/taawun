import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Sparkles, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShiftData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  payType: 'hourly' | 'fixed';
  payAmount: number;
  workersNeeded: number;
  requirements?: string;
}

export default function BusinessAssistant() {
  const { isRTL } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearMessages } = useChat('business-assistant');
  const [pendingShifts, setPendingShifts] = useState<ShiftData[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check for JSON in the last assistant message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const jsonMatch = lastMessage.content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.ready_to_create && parsed.shifts) {
            setPendingShifts(parsed.shifts);
          }
        } catch (e) {
          // Not valid JSON, ignore
        }
      }
    }
  }, [messages]);

  const handleSend = async (input: string) => {
    setPendingShifts(null);
    await sendMessage(input, { businessId: user?.id });
  };

  const handleCreateShifts = async () => {
    if (!pendingShifts || !user) return;
    
    setIsCreating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'create_shifts',
            businessId: user.id,
            shifts: pendingShifts,
          }),
        }
      );

      const data = await response.json();
      
      if (data.results) {
        const successful = data.results.filter((r: any) => r.success);
        const failed = data.results.filter((r: any) => !r.success);
        
        if (successful.length > 0) {
          toast.success(
            isRTL 
              ? `تم إنشاء ${successful.length} وردية بنجاح!` 
              : `${successful.length} shift(s) created successfully!`
          );
        }
        
        if (failed.length > 0) {
          toast.error(
            isRTL 
              ? `فشل إنشاء ${failed.length} وردية` 
              : `Failed to create ${failed.length} shift(s)`
          );
        }
        
        if (successful.length > 0) {
          clearMessages();
          navigate('/business/dashboard');
        }
      }
    } catch (error) {
      console.error('Error creating shifts:', error);
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const suggestions = isRTL
    ? [
        'أريد عاملين، واحد للمطبخ وواحد للخدمة',
        'أحتاج 3 عمال لفعالية يوم السبت',
        'وظائف كاشير لهذا الأسبوع',
      ]
    : [
        'I need 2 workers, one for kitchen and one for serving',
        'I need 3 workers for an event on Saturday',
        'Cashier positions for this week',
      ];

  return (
    <MobileLayout footer={<BottomNav />} noPadding>
      <PageHeader 
        title={isRTL ? 'مساعد نشر الورديات' : 'Shift Posting Assistant'}
        showBack
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {isRTL ? 'مرحباً! كيف أساعدك؟' : 'Hi! How can I help you?'}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {isRTL 
                  ? 'أخبرني عن الورديات التي تريد نشرها' 
                  : 'Tell me about the shifts you want to post'}
              </p>
              
              <div className="space-y-2 w-full max-w-xs">
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                  <Sparkles size={12} />
                  {isRTL ? 'اقتراحات' : 'Suggestions'}
                </p>
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="w-full p-3 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-start"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} isRTL={isRTL} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3 p-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        {pendingShifts && !isLoading && (
          <div className="p-4 border-t bg-success/5">
            <div className="flex items-center gap-2 mb-3">
              <Check className="text-success" size={20} />
              <span className="font-medium">
                {isRTL 
                  ? `${pendingShifts.length} وردية جاهزة للنشر` 
                  : `${pendingShifts.length} shift(s) ready to post`}
              </span>
            </div>
            <Button 
              onClick={handleCreateShifts} 
              className="w-full" 
              size="lg"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="me-2 animate-spin" size={18} />
                  {isRTL ? 'جاري النشر...' : 'Creating...'}
                </>
              ) : (
                isRTL ? 'نشر الورديات' : 'Create Shifts'
              )}
            </Button>
          </div>
        )}
        
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
          isRTL={isRTL}
        />
      </div>
    </MobileLayout>
  );
}
