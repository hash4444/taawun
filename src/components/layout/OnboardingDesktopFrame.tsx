import { ReactNode } from 'react';
import { useApp } from '@/hooks/useApp';
import { Zap, ShieldCheck, Globe2, Sparkle } from 'lucide-react';
import logo from '@/assets/logo.png';

interface OnboardingDesktopFrameProps {
  children: ReactNode;
  /** Top-right slot, e.g. LanguageSwitch */
  topAction?: ReactNode;
}

/**
 * Desktop-only split layout for the onboarding/auth flow (Welcome, Role
 * Selection, Login, Signup). Left column is the page's own content (form,
 * choices, CTA); right column is a fixed brand panel shared across the flow
 * so the whole onboarding sequence reads as one consistent desktop surface
 * instead of a narrow mobile column floating in empty space.
 */
export function OnboardingDesktopFrame({ children, topAction }: OnboardingDesktopFrameProps) {
  const { t, isRTL } = useApp();

  const benefits = [
    { icon: Zap, label: t('benefit1') },
    { icon: ShieldCheck, label: t('benefit2') },
    { icon: Globe2, label: t('benefit3') },
  ];

  return (
    <div className="hidden md:flex min-h-screen w-full bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left: page content */}
      <div className="relative flex-1 flex flex-col min-w-0">
        {/* Faint dot-grid texture, restrained */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_60%_50%_at_30%_20%,black,transparent)]"
          style={{
            backgroundImage: 'radial-gradient(hsl(var(--foreground) / 0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative flex justify-end px-8 pt-6">{topAction}</div>
        <div className="relative flex-1 flex items-center justify-center px-8 pb-16">
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </div>

      {/* Right: brand panel — layered gradient mesh + glass benefit cards */}
      <div className="relative hidden lg:flex w-[460px] flex-shrink-0 flex-col items-center justify-center overflow-hidden bg-primary-dark px-10">
        {/* Gradient mesh layers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 20% 10%, hsl(var(--primary) / 0.9), transparent 60%), radial-gradient(ellipse 60% 60% at 90% 90%, hsl(164 70% 45% / 0.8), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 15%, hsl(0 0% 100% / 0.15), transparent 60%)',
          }}
        />
        {/* Fine grain/dot texture for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(hsl(0 0% 100% / 0.4) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -end-16 w-80 h-80 rounded-full opacity-40 blur-3xl bg-white animate-pulse [animation-duration:6s]"
        />

        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
            <Sparkle size={13} className="text-primary-foreground/90" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/90">
              {isRTL ? 'سوق العمل الجديد' : 'The new way to work'}
            </span>
          </div>

          <img src={logo} alt="Taawun" className="w-20 h-20 rounded-3xl shadow-2xl mb-6 ring-1 ring-white/20" />
          <h2 className="text-[28px] font-bold text-primary-foreground text-center mb-2 tracking-tight leading-tight">
            {t('welcome')}
          </h2>
          <p className="text-primary-foreground/80 text-center mb-9 max-w-xs">
            {t('heroSubhead')}
          </p>

          <ul className="w-full max-w-xs space-y-3">
            {benefits.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md px-4 py-3.5 shadow-lg shadow-black/10 transition-transform hover:scale-[1.02]"
                style={{ animationDelay: `${150 + i * 100}ms`, animationDuration: '600ms', animationFillMode: 'backwards' }}
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 text-primary-foreground flex-shrink-0">
                  <Icon size={17} />
                </span>
                <span className="text-sm font-medium text-primary-foreground text-start">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
