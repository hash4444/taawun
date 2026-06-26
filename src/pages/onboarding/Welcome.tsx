import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { OnboardingDesktopFrame } from '@/components/layout/OnboardingDesktopFrame';
import { Zap, ShieldCheck, Globe2 } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useApp();
  const isMobile = useIsMobile();

  const handleContinue = () => {
    navigate('/onboarding/role');
  };

  const benefits = [
    { icon: Zap, label: t('benefit1') },
    { icon: ShieldCheck, label: t('benefit2') },
    { icon: Globe2, label: t('benefit3') },
  ];

  if (!isMobile) {
    return (
      <OnboardingDesktopFrame topAction={<LanguageSwitch />}>
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">{t('welcome')}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t('heroSubhead')}</p>
        <Button onClick={handleContinue} className="w-full h-14 text-lg font-semibold" size="lg">
          {t('getStarted')}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">{t('noCardRequired')}</p>
      </OnboardingDesktopFrame>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background">
      {/* Signature ambient glow — restrained, brand-color only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -start-24 w-72 h-72 rounded-full opacity-40 blur-3xl"
        style={{ background: 'hsl(var(--primary) / 0.35)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -end-28 w-80 h-80 rounded-full opacity-30 blur-3xl"
        style={{ background: 'hsl(var(--primary-light))' }}
      />

      {/* Language Switch - Top Left */}
      <div className="relative px-4 pt-safe">
        <div className="flex justify-start pt-4">
          <LanguageSwitch />
        </div>
      </div>

      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10">
        <img
          src={logo}
          alt="Taawun Logo"
          className="w-24 h-24 rounded-3xl mb-7 shadow-lg ring-1 ring-border"
        />

        <h1 className="text-3xl font-bold text-foreground text-center mb-2 tracking-tight">
          {t('welcome')}
        </h1>
        <p className="text-lg text-muted-foreground text-center max-w-xs">
          {t('heroSubhead')}
        </p>

        {/* Benefit list — each maps to a real product capability, not decoration */}
        <ul className="mt-9 w-full max-w-sm space-y-3">
          {benefits.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3 shadow-sm"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-light text-primary flex-shrink-0">
                <Icon size={18} />
              </span>
              <span className="text-sm font-medium text-foreground text-start">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="relative px-6 pb-8 space-y-3">
        <Button
          onClick={handleContinue}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {t('getStarted')}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t('noCardRequired')}</p>
      </div>
    </div>
  );
}
