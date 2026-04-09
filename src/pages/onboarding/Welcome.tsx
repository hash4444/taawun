import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import logo from '@/assets/logo.png';
export default function Welcome() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useApp();

  const handleContinue = () => {
    navigate('/onboarding/role');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-light to-background">
      {/* Language Switch - Top Left */}
      <div className="px-4 pt-safe">
        <div className="flex justify-start pt-4">
          <LanguageSwitch />
        </div>
      </div>

      {/* Top Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <img 
          src={logo} 
          alt="Taawun Logo" 
          className="w-24 h-24 rounded-3xl mb-8 shadow-lg"
        />

        {/* Welcome Text */}
        <h1 className="text-3xl font-bold text-foreground text-center mb-2">
          {t('welcome')}
        </h1>
        <p className="text-lg text-muted-foreground text-center">
          {t('tagline')}
        </p>
      </div>

      {/* Continue Button */}
      <div className="px-6 pb-8">
        <Button
          onClick={handleContinue}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}
