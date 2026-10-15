import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function VerifyPhone() {
  const { isRTL } = useApp();
  const enabled = import.meta.env.VITE_PHONE_AUTH_ENABLED === 'true';
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      const { error } = sent
        ? await supabase.auth.verifyOtp({ phone, token, type: 'phone_change' })
        : await supabase.auth.updateUser({ phone });
      if (error) throw error;
      if (sent) setVerified(true); else setSent(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Phone verification failed'); }
    finally { setBusy(false); }
  };
  return <div className="max-w-md mx-auto p-6 space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
    <h1 className="text-xl font-semibold">{isRTL ? 'تأكيد رقم الهاتف' : 'Verify your phone'}</h1>
    {!enabled ? <p>{isRTL ? 'تأكيد الهاتف غير متاح حالياً. يمكنك استخدام البريد الإلكتروني.' : 'Phone verification is not configured yet. You can continue using email authentication.'}</p> : verified ? <p role="status">{isRTL ? 'تم تأكيد رقم الهاتف.' : 'Your phone number is verified.'}</p> : <form onSubmit={submit} className="space-y-4">
      <Label htmlFor="verification-phone">{isRTL ? 'رقم الهاتف' : 'Phone number'}</Label>
      <Input id="verification-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567" type="tel" required disabled={sent} />
      {sent && <><Label htmlFor="verification-code">{isRTL ? 'رمز التأكيد' : 'Verification code'}</Label><Input id="verification-code" inputMode="numeric" value={token} onChange={e => setToken(e.target.value)} pattern="[0-9]{6}" required /></>}
      <Button disabled={busy}>{isRTL ? 'متابعة' : sent ? 'Verify code' : 'Send code'}</Button>
    </form>}
    <Link className="text-primary underline" to="/">{isRTL ? 'العودة للحساب' : 'Return to account'}</Link>
  </div>;
}
