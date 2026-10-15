import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SocialAuthButtons({ role }: { role?: string }) {
  const { signInWithGoogle, signInWithMicrosoft, oauthProviders } = useAuth();
  const { isRTL } = useApp();
  const attempt = async (provider: 'google' | 'microsoft') => {
    try { await (provider === 'google' ? signInWithGoogle(role) : signInWithMicrosoft(role)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not start sign in.'); }
  };
  return <div className="space-y-3">
    <Button type="button" variant="outline" className="w-full h-12" disabled={!oauthProviders.google} onClick={() => void attempt('google')}>
      {isRTL ? 'المتابعة باستخدام Google' : 'Continue with Google'}
    </Button>
    {oauthProviders.microsoft && <Button type="button" variant="outline" className="w-full h-12" onClick={() => void attempt('microsoft')}>
      {isRTL ? 'المتابعة باستخدام Microsoft' : 'Continue with Microsoft'}
    </Button>}
    {!oauthProviders.google && <p className="text-xs text-muted-foreground">{isRTL ? 'تسجيل الدخول الاجتماعي غير مُعد بعد. استخدم البريد الإلكتروني أدناه.' : 'Google sign-in is not configured yet. Use email below.'}</p>}
  </div>;
}
