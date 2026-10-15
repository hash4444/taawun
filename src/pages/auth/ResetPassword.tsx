import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/hooks/useApp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ResetPassword() {
  const { isRTL } = useApp();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      if (!isSupabaseConfigured) throw new Error('Authentication is not configured for this environment.');
      const { error } = user
        ? await supabase.auth.updateUser({ password })
        : await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/auth/reset-password` });
      if (error) throw error;
      setSent(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Password reset failed'); }
    finally { setBusy(false); }
  };
  return <main className="max-w-md mx-auto p-6 space-y-5" dir={isRTL ? 'rtl' : 'ltr'}><h1 className="text-xl font-semibold">{isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset password'}</h1>
    {sent ? <p role="status">{user ? (isRTL ? 'تم تحديث كلمة المرور.' : 'Your password has been updated.') : (isRTL ? 'إذا كان البريد مرتبطاً بحساب، سيصلك رابط لإعادة التعيين.' : 'If an account uses this email, a password reset link will arrive shortly.')}</p> : <form onSubmit={submit} className="space-y-4">
      <Label htmlFor="reset-value">{user ? (isRTL ? 'كلمة مرور جديدة' : 'New password') : (isRTL ? 'البريد الإلكتروني' : 'Email')}</Label>
      <Input id="reset-value" type={user ? 'password' : 'email'} value={user ? password : email} onChange={e => user ? setPassword(e.target.value) : setEmail(e.target.value)} minLength={user ? 12 : undefined} required />
      <Button disabled={busy}>{isRTL ? 'متابعة' : user ? 'Save new password' : 'Send reset link'}</Button>
    </form>}
    <Link to={user ? '/' : '/auth/login'} className="text-primary underline">{isRTL ? 'العودة' : 'Back to sign in'}</Link>
  </main>;
}
