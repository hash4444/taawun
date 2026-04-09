import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isRTL?: boolean;
}

export function ChatMessage({ role, content, isRTL }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className={cn('prose prose-sm max-w-none', isUser && 'prose-invert')}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 list-disc list-inside">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 list-decimal list-inside">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              code: ({ children }) => (
                <code className={cn(
                  'px-1 py-0.5 rounded text-xs',
                  isUser ? 'bg-primary-foreground/20' : 'bg-background'
                )}>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className={cn(
                  'p-2 rounded-lg overflow-x-auto text-xs my-2',
                  isUser ? 'bg-primary-foreground/20' : 'bg-background'
                )}>
                  {children}
                </pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
