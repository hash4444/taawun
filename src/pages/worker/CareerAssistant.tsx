import { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatSessionSidebar } from '@/components/chat/ChatSessionSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { useCVRecords } from '@/hooks/useCV';
import { useChatSessions } from '@/hooks/useChatSessions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import brandLogo from '@/assets/logo.png';
import {
  FileText,
  Search,
  MessageSquare,
  Target,
  Bot,
  DollarSign,
  UserCheck,
  PanelLeft,
  Plus,
} from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface ActionCard {
  key: string;
  icon: React.ElementType;
  en: string;
  ar: string;
  desc_en: string;
  desc_ar: string;
  prompt_en: string;
  prompt_ar: string;
  primary?: boolean;
}

const ACTION_CARDS: ActionCard[] = [
  {
    key: 'cv',
    icon: FileText,
    en: 'Create CV',
    ar: 'إنشاء سيرة ذاتية',
    desc_en: 'ATS-optimized resume',
    desc_ar: 'سيرة ذاتية احترافية',
    prompt_en: 'I want to create or improve my CV. Review my existing data and help me build a professional, ATS-optimized CV.',
    prompt_ar: 'أريد إنشاء أو تحسين سيرتي الذاتية. راجع بياناتي الحالية وساعدني في بناء سيرة ذاتية احترافية.',
    primary: true,
  },
  {
    key: 'jobs',
    icon: Search,
    en: 'Find Jobs',
    ar: 'ابحث عن وظائف',
    desc_en: 'AI-matched roles',
    desc_ar: 'وظائف مطابقة بالذكاء',
    prompt_en: 'Find jobs that match my profile. Use my CV, skills, and location to recommend the best opportunities with explanations of why each matches me.',
    prompt_ar: 'ابحث عن وظائف تناسب ملفي الشخصي. استخدم سيرتي الذاتية ومهاراتي وموقعي للتوصية بأفضل الفرص مع شرح لماذا تناسبني.',
  },
  {
    key: 'interview',
    icon: MessageSquare,
    en: 'Interview',
    ar: 'مقابلات',
    desc_en: 'Mock & feedback',
    desc_ar: 'تدريب وتقييم',
    prompt_en: 'I want interview coaching. Run a mock interview session based on my profile and target roles, then score my answers and give improvement tips.',
    prompt_ar: 'أريد التدريب على المقابلات. أجرِ جلسة مقابلة تجريبية بناءً على ملفي والأدوار المستهدفة، ثم قيّم إجاباتي وقدم نصائح للتحسين.',
  },
  {
    key: 'career',
    icon: Target,
    en: 'Plan Career',
    ar: 'تخطيط مهني',
    desc_en: '30/60/90-day plan',
    desc_ar: 'خطة نمو مخصّصة',
    prompt_en: 'Help me plan my career path. Based on my current skills and experience, suggest career directions, skill gaps to fill, and create a 30/60/90 day improvement plan.',
    prompt_ar: 'ساعدني في تخطيط مساري المهني. بناءً على مهاراتي وخبرتي الحالية، اقترح اتجاهات مهنية وفجوات مهارية وأنشئ خطة تحسين 30/60/90 يومًا.',
  },
  {
    key: 'monetize',
    icon: DollarSign,
    en: 'Monetize Skills',
    ar: 'استثمر مهاراتي',
    desc_en: 'Freelance ideas',
    desc_ar: 'أفكار عمل حر',
    prompt_en: 'How can I monetize my skills? Suggest freelance opportunities, side projects, and ways to earn income based on my current skill set and experience.',
    prompt_ar: 'كيف أستثمر مهاراتي؟ اقترح فرص عمل حر ومشاريع جانبية وطرق لكسب الدخل بناءً على مهاراتي وخبراتي الحالية.',
  },
  {
    key: 'analyze',
    icon: UserCheck,
    en: 'Analyze Profile',
    ar: 'حلّل ملفي',
    desc_en: 'Score & tips',
    desc_ar: 'درجة ونصائح',
    prompt_en: 'Analyze my complete profile including CV, skills, and experience. Give me a competitiveness score out of 10, identify weaknesses, and provide specific actionable improvements.',
    prompt_ar: 'حلّل ملفي الكامل بما في ذلك السيرة الذاتية والمهارات والخبرة. أعطني درجة تنافسية من 10، وحدد نقاط الضعف، وقدم تحسينات محددة وقابلة للتنفيذ.',
  },
];

export default function CareerAssistant() {
  const { isRTL } = useApp();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: cvRecords } = useCVRecords();
  const hasCV = cvRecords && cvRecords.length > 0;

  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [uiActions, setUiActions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createSession,
    updateSessionMessages,
    autoTitle,
    renameSession,
    pinSession,
    archiveSession,
    deleteSession,
  } = useChatSessions();

  useEffect(() => {
    const effectiveUserId = user?.id || 'e0af6d3d-4223-4017-b344-8a9689473d8f';
    supabase.from('profiles').select('full_name').eq('id', effectiveUserId).single()
      .then(({ data: profile }) => {
        const name = profile?.full_name || user?.email?.split('@')[0] || (effectiveUserId === 'e0af6d3d-4223-4017-b344-8a9689473d8f' ? 'John' : '');
        setUserName(name);
      });
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (activeSessionId && activeSession) {
      if (!isLoading) {
        setMessages(activeSession.messages);
      }
    } else if (!activeSessionId) {
      setMessages([]);
    }
  }, [activeSessionId, activeSession, isLoading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendToAssistant = useCallback(async (allMessages: Message[], sessionId: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${CHAT_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: allMessages[allMessages.length - 1].content,
          threadId: sessionId,
          history: allMessages.slice(0, -1),
        }),
      });

      if (!resp.ok) throw new Error('Assistant communication failed');

      const data = await resp.json();

      const content = data.assistantMessage || data.assistant_message || data.message || "I'm sorry, I couldn't process that.";
      const assistantMsg: Message = { role: 'assistant', content };
      const finalMsgs = [...allMessages, assistantMsg];

      setMessages(finalMsgs);
      setQuickReplies(data.quickReplies || data.quick_replies || []);
      setUiActions(data.uiActions || data.ui_actions || []);

      if (!activeSessionId && data.threadId) {
        setActiveSessionId(data.threadId);
      }

      const uploadAction = (data.uiActions || []).find((a: any) => a.type === 'UPLOAD_CV');
      if (uploadAction && fileInputRef.current) {
        setTimeout(() => fileInputRef.current?.click(), 100);
      }

      if (sessionId || data.threadId) {
        const sid = sessionId || data.threadId;
        if (sid.length > 30) {
          await updateSessionMessages(sid, finalMsgs);
          if (activeSession && activeSession.title === 'New Chat') {
            await autoTitle(sid, finalMsgs);
          }
        }
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      toast.error(isRTL ? 'حدث خطأ في الاتصال.' : 'Communication error.');
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, activeSession, updateSessionMessages, autoTitle, isRTL]);

  const handleSend = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setQuickReplies([]);
    setIsLoading(true);

    let sid = activeSessionId;
    if (!sid) {
      sid = await createSession(userMsg);
      if (sid) setActiveSessionId(sid);
    } else if (sid.length > 30) {
      await updateSessionMessages(sid, newMessages);
    }

    await sendToAssistant(newMessages, sid || '');
  }, [activeSessionId, messages, isLoading, createSession, updateSessionMessages, sendToAssistant]);

  const handleQuickAction = (key: string) => {
    const card = ACTION_CARDS.find(c => c.key === key);
    if (!card) return;
    handleSend(isRTL ? card.prompt_ar : card.prompt_en);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setDrawerOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setDrawerOpen(false);
  };

  const showWelcome = messages.length === 0 && !isLoading && !activeSessionId;

  const sidebarContent = (
    <ChatSessionSidebar
      sessions={sessions}
      activeSessionId={activeSessionId}
      onSelect={handleSelectSession}
      onNew={handleNewChat}
      onRename={renameSession}
      onPin={pinSession}
      onArchive={archiveSession}
      onDelete={deleteSession}
      isRTL={isRTL}
    />
  );

  return (
    <ErrorBoundary>
      <MobileLayout footer={<BottomNav />} noPadding>
        <div className="flex items-center justify-between px-4 pt-safe pb-3 border-b border-border/60 bg-background">
          <div className="flex items-center gap-2">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <PanelLeft size={18} strokeWidth={1.5} />
                </button>
              </SheetTrigger>
              <SheetContent side={isRTL ? 'right' : 'left'} className="w-72 p-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>
            <img src={brandLogo} alt="Logo" className="w-7 h-7 rounded-md object-contain" />
            <h1 className="text-base font-semibold text-foreground">
              {isRTL ? 'المساعد المهني' : 'Career Assistant'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleNewChat} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Plus size={18} strokeWidth={1.5} />
            </button>
            <LanguageSwitch />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 bg-background/50" ref={scrollRef}>
            {showWelcome ? (
              <div className="w-full max-w-[600px] mx-auto px-4 pt-12 pb-4 flex flex-col items-center text-center">
                <h2 className="text-[28px] font-semibold text-foreground mb-2">
                  {isRTL ? `مرحباً${userName ? ` ${userName}` : ''} 👋` : `Hi${userName ? ` ${userName}` : ''} 👋`}
                </h2>
                <div className="flex flex-col gap-3 items-center mt-8 w-full">
                  {ACTION_CARDS.map((card) => (
                    <button
                      key={card.key}
                      onClick={() => handleQuickAction(card.key)}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl border border-border bg-card hover:bg-accent transition-all w-full max-w-[400px]"
                    >
                      <card.icon size={18} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{isRTL ? card.ar : card.en}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[800px] mx-auto pb-8">
                {messages.map((msg, i) => (msg.content && msg.content.trim() !== '' && (
                  <ChatMessage key={i} role={msg.role} content={msg.content} isRTL={isRTL} />
                )))}

                {!isLoading && quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 py-2 mt-4 ml-12" dir={isRTL ? 'rtl' : 'ltr'}>
                    {quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(reply)}
                        className="px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {isLoading && (
                  <div className="flex gap-3 p-4 ml-2">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center animate-pulse"><Bot size={14} /></div>
                    <div className="bg-muted/50 rounded-xl px-4 py-2.5"><div className="flex gap-1.5"><span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" /><span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="p-4 bg-background border-t border-border/50">
            <ChatInput onSend={handleSend} disabled={isLoading} placeholder={isRTL ? 'كيف يمكنني مساعدتك؟' : 'How can I help you?'} isRTL={isRTL} />
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) toast.info(`File selected: ${file.name}`);
          }}
        />
      </MobileLayout>
    </ErrorBoundary>
  );
}
