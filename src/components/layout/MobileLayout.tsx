import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
}

export function MobileLayout({ children, className, header, footer, noPadding }: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {header && (
        <header className="sticky top-0 z-40 glass border-b border-border pt-safe">
          {header}
        </header>
      )}
      
      <main 
        className={cn(
          'flex-1 flex flex-col',
          !noPadding && 'px-4 py-6',
          footer && 'pb-24',
          className
        )}
      >
        {children}
      </main>
      
      {footer && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border pb-safe">
          {footer}
        </footer>
      )}
    </div>
  );
}
