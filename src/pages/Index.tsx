import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, profile } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/onboarding/welcome', { replace: true });
    } else if (profile?.role === 'business') {
      navigate('/business/dashboard', { replace: true });
    } else {
      navigate('/worker/home', { replace: true });
    }
  }, [isAuthenticated, isLoading, profile, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <img 
        src={logo} 
        alt="Taawun Logo" 
        className="w-20 h-20 rounded-2xl animate-pulse"
      />
    </div>
  );
};

export default Index;
