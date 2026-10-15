import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BusinessDesktopShell } from '@/components/layout/BusinessDesktopShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function BusinessInfo() {
  const { isRTL } = useApp();
  const { user, profile, businessData, refreshProfile } = useAuth();
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ trade_name: businessData?.trade_name || '', legal_name: businessData?.legal_name || '', sector: businessData?.sector || '', size: businessData?.size || '', full_name: profile?.full_name || '', phone: profile?.phone || '', city: profile?.city || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!user) return; setBusy(true); setError('');
    try {
      const { error: profileError } = await supabase.from('profiles').update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null, city: form.city.trim() || null, country: 'AE' }).eq('id', user.id).select('id').single();
      if (profileError) throw profileError;
      const { error: businessError } = await supabase.from('businesses').update({ trade_name: form.trade_name.trim(), legal_name: form.legal_name.trim(), sector: form.sector.trim() || null, size: form.size.trim() || null }).eq('id', user.id).select('id').single();
      if (businessError) throw businessError;
      await refreshProfile(); toast.success(isRTL ? 'تم حفظ معلومات المنشأة' : 'Business information saved');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save business information.'); }
    finally { setBusy(false); }
  };
  const fields = [
    ['trade_name', isRTL ? 'الاسم التجاري' : 'Trade name'], ['legal_name', isRTL ? 'الاسم القانوني' : 'Legal name'],
    ['sector', isRTL ? 'القطاع' : 'Sector'], ['size', isRTL ? 'عدد الموظفين' : 'Company size'],
    ['full_name', isRTL ? 'اسم ممثل المنشأة' : 'Business representative name'], ['phone', isRTL ? 'الهاتف' : 'Contact phone'],
    ['city', isRTL ? 'الإمارة أو المدينة' : 'Emirate / city'],
  ] as const;
  const body = <div className="max-w-3xl mx-auto space-y-5" dir={isRTL ? 'rtl' : 'ltr'}><h1 className="text-2xl font-bold">{isRTL ? 'معلومات المنشأة' : 'Business information'}</h1><p className="text-muted-foreground">{isRTL ? 'استخدم البيانات المطابقة لوثائق منشأتك. مراجعة التحقق تتم بشكل منفصل.' : 'Use details matching your business documents. Verification is reviewed separately.'}</p>{error && <p role="alert" className="text-destructive">{error}</p>}<form onSubmit={save} className="border rounded-xl p-5 space-y-5"><div className="grid sm:grid-cols-2 gap-5">{fields.map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`business-${key}`}>{label}</Label><Input id={`business-${key}`} value={form[key]} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} required={['trade_name', 'legal_name', 'full_name'].includes(key)} maxLength={160} type={key === 'phone' ? 'tel' : 'text'} /></div>)}</div><Button type="submit" disabled={busy}>{busy ? (isRTL ? 'جارٍ الحفظ…' : 'Saving…') : (isRTL ? 'حفظ المعلومات' : 'Save information')}</Button></form></div>;
  if (!isMobile) return <BusinessDesktopShell>{body}</BusinessDesktopShell>;
  return <MobileLayout header={<PageHeader title={isRTL ? 'معلومات المنشأة' : 'Business information'} showBack backPath="/business/profile" />}><div className="py-4">{body}</div></MobileLayout>;
}
