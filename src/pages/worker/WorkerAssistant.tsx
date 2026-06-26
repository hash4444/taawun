import { useRef, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Sparkles } from 'lucide-react';

export default function WorkerAssistant() {
  const { isRTL } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage } = useChat('worker-assistant');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (input: string) => {
    await sendMessage(input);
  };

  const suggestions = isRTL
    ? [
        'ابحث لي عن وظائف في مجال الفعاليات',
        'أريد عمل في المطاعم هذا الأسبوع',
        'وظائف براتب عالي بالساعة',
      ]
    : [
        'Find me jobs for events',
        'I want restaurant work this week',
        'High paying hourly jobs',
      ];

  return (
    <MobileLayout footer={<BottomNav />} noPadding>
      <PageHeader 
        title={isRTL ? 'مساعد البحث عن وظائف' : 'Job Search Assistant'}
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
                  ? 'أخبرني عن نوع العمل الذي تبحث عنه' 
                  : 'Tell me what kind of work you\'re looking for'}
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
