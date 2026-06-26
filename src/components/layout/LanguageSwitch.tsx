import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { SUPPORTED_LANGUAGES, Language } from '@/lib/i18n';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSwitch({ className }: { className?: string }) {
  const { language, setLanguage } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted transition-colors"
        aria-label="Switch language"
      >
        <Globe size={14} className="text-muted-foreground" />
        <span>{current?.nativeLabel ?? 'EN'}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 start-0 z-50 min-w-[160px] rounded-xl border border-border bg-card shadow-lg py-1 animate-in fade-in-0 zoom-in-95">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors text-start',
                language === lang.code && 'text-primary font-medium'
              )}
            >
              <span>{lang.nativeLabel}</span>
              {language === lang.code && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
