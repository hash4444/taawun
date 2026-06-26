import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useApp } from "@/hooks/useApp";
import { Button } from "@/components/ui/button";
import { Home, MapPinOff } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL } = useApp();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-light flex items-center justify-center">
          <MapPinOff size={48} className="text-primary" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
        
        {/* Message */}
        <p className="mb-2 text-xl font-semibold text-foreground">
          {isRTL ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </p>
        <p className="mb-8 text-muted-foreground">
          {isRTL 
            ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
            : "Sorry, the page you're looking for doesn't exist or has been moved."}
        </p>

        {/* Go Home Button */}
        <Button 
          onClick={() => navigate('/')}
          className="h-12 px-8"
        >
          <Home size={18} className="me-2" />
          {isRTL ? 'العودة للرئيسية' : 'Go to Home'}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
