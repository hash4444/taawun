import { useState, useRef, useEffect, useId } from 'react';
import { useApp } from '@/hooks/useApp';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSwitch({ className }: { className?: string }) {
  const { language, setLanguage, isRTL } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const current = SUPPORTED_LANGUAGES.find(item => item.code === language) || SUPPORTED_LANGUAGES[0];
  return <div ref={ref} className={cn('relative', className)}><button ref={triggerRef} onClick={() => setOpen(value => !value)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted transition-colors" aria-label={isRTL ? 'تغيير اللغة' : 'Switch language'} aria-expanded={open} aria-controls={optionsId}><Globe size={14} className="text-muted-foreground" aria-hidden="true" /><span>{current.nativeLabel}</span></button>{open && <div id={optionsId} role="group" aria-label={isRTL ? 'لغة الواجهة' : 'Interface language'} className="absolute top-full mt-1 end-0 z-50 min-w-[160px] rounded-xl border border-border bg-card shadow-lg py-1">{SUPPORTED_LANGUAGES.map(item => <button key={item.code} aria-pressed={language === item.code} onClick={() => { setLanguage(item.code); setOpen(false); triggerRef.current?.focus(); }} className={cn('w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted text-start', language === item.code && 'text-primary font-medium')}><span>{item.nativeLabel}</span>{language === item.code && <Check size={14} className="text-primary" aria-hidden="true" />}</button>)}</div>}</div>;
}
