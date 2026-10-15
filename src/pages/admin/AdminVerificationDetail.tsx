import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useUserDocuments, useApproveDocument, useRejectDocument, useUpdateVerificationStatus } from '@/hooks/useKYC';
import { supabase } from '@/integrations/supabase/client';
import { reviewedVerification } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const labels: Record<string, { en: string; ar: string }> = {
  id_front: { en: 'ID front', ar: 'الهوية (أمام)' }, id_back: { en: 'ID back', ar: 'الهوية (خلف)' },
  selfie: { en: 'Selfie', ar: 'صورة شخصية' }, commercial_reg: { en: 'Commercial registration', ar: 'السجل التجاري' },
  license: { en: 'Business licence', ar: 'الرخصة التجارية' }, rep_id: { en: 'Representative ID', ar: 'هوية المفوض' },
};

export default function AdminVerificationDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { isRTL } = useApp();
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const documents = useUserDocuments(userId);
  const approve = useApproveDocument();
  const reject = useRejectDocument();
  const review = useUpdateVerificationStatus();
  const target = useQuery({
    queryKey: ['verification-target', userId], enabled: !!userId,
    queryFn: async () => {
      const [profile, worker, business] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId!).maybeSingle(),
        supabase.from('workers').select('*').eq('id', userId!).maybeSingle(),
        supabase.from('businesses').select('*').eq('id', userId!).maybeSingle(),
      ]);
      for (const result of [profile, worker, business]) if (result.error) throw result.error;
      return { profile: profile.data, worker: worker.data, business: business.data };
    },
  });
  const role = target.data?.profile?.role === 'business' ? 'business' : 'worker';
  const record = role === 'business' ? target.data?.business : target.data?.worker;
  const required = role === 'business' ? ['commercial_reg', 'license', 'rep_id'] : ['id_front', 'id_back', 'selfie'];
  const allApproved = required.every(type => documents.data?.some(doc => doc.doc_type === type && doc.status === 'approved' && !!doc.reviewed_by && !!doc.reviewed_at));
  const busy = approve.isPending || reject.isPending || review.isPending;
  const decideDocument = async (documentId: string, docType: string, status: 'approved' | 'rejected') => {
    if (!userId || !user) return;
    if (status === 'rejected' && !notes.trim()) { setError(isRTL ? 'أضف سبب الرفض في الملاحظات.' : 'Add a rejection reason in the review notes.'); return; }
    setError('');
    try {
      await (status === 'approved' ? approve : reject).mutateAsync({ documentId, userId, docType, userRole: role, adminId: user.id, rejectionReason: notes });
      toast.success(isRTL ? 'تم حفظ مراجعة المستند' : 'Document review recorded');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Document review failed.'); }
  };
  const decideAccount = async (status: 'verified' | 'rejected') => {
    if (!userId || !user) return;
    if (status === 'rejected' && !notes.trim()) { setError(isRTL ? 'أضف سبب الرفض في الملاحظات.' : 'Add a rejection reason in the review notes.'); return; }
    setError('');
    try {
      await review.mutateAsync({ userId, role, status, adminId: user.id, notes });
      await target.refetch();
      toast.success(isRTL ? 'تم حفظ قرار التحقق' : 'Account verification decision recorded');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Account verification failed.'); }
  };
  const viewDocument = async (storagePath: string) => {
    const [bucket, ...path] = storagePath.split('/');
    const { data, error: urlError } = await supabase.storage.from(bucket).createSignedUrl(path.join('/'), 60);
    if (urlError || !data?.signedUrl) { setError(isRTL ? 'تعذر فتح المستند' : 'Could not open document'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };
  return <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}><AdminHeader title={isRTL ? 'مراجعة التحقق' : 'Verification review'} showBack backPath="/admin/verifications" />
    <main className="max-w-4xl mx-auto p-4 space-y-5">
      {(error || documents.error || target.error) && <div role="alert" className="border border-destructive rounded-lg p-3 text-destructive">{error || (isRTL ? 'تعذر تحميل بيانات التحقق. أعد المحاولة.' : 'Could not load verification information. Please retry.')}<Button variant="outline" onClick={() => { void target.refetch(); void documents.refetch(); }}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Button></div>}
      {documents.isLoading || target.isLoading ? <p role="status">{isRTL ? 'جارٍ التحميل…' : 'Loading…'}</p> : !target.data?.profile ? <p>{isRTL ? 'الحساب غير موجود' : 'Account not found'}</p> : <>
        <section className="border rounded-xl p-5 space-y-3"><h1 className="text-xl font-semibold">{target.data.profile.full_name || target.data.profile.email}</h1><p>{target.data.profile.email}</p><StatusBadge status={reviewedVerification(record)} />
          {record?.verification_status === 'verified' && (!record.verification_reviewed_at || !record.verification_reviewed_by) && <p className="text-sm text-muted-foreground">{isRTL ? 'تحتاج الموافقة القديمة إلى إعادة مراجعة موثقة قبل تفعيل الصلاحيات.' : 'This legacy approval needs a recorded administrator review before verified access is enabled.'}</p>}
        </section>
        <section className="border rounded-xl p-5 space-y-4"><h2 className="font-semibold">{isRTL ? 'قرار الحساب النهائي' : 'Final account decision'}</h2><p className="text-sm text-muted-foreground">{isRTL ? 'راجع المستندات المطلوبة أولاً، ثم اتخذ قراراً منفصلاً بشأن الحساب. تصل إشعارات المراجعة داخل التطبيق.' : 'Review each required document, then make a separate account decision. Review notifications are recorded in the app.'}</p><Label htmlFor="review-notes">{isRTL ? 'ملاحظات المراجعة وسبب الرفض' : 'Review notes / rejection reason'}</Label><Textarea id="review-notes" value={notes} onChange={event => setNotes(event.target.value)} rows={3} maxLength={2000} />
          <div className="flex flex-wrap gap-3"><Button disabled={busy || !allApproved} onClick={() => void decideAccount('verified')}>{isRTL ? 'اعتماد التحقق من الحساب' : 'Approve account verification'}</Button><Button variant="destructive" disabled={busy} onClick={() => void decideAccount('rejected')}>{isRTL ? 'رفض التحقق' : 'Reject verification'}</Button></div>{!allApproved && <p className="text-xs text-muted-foreground">{isRTL ? 'يجب اعتماد جميع المستندات المطلوبة مع تسجيل المراجع أولاً.' : 'All required documents need recorded approval before the account can be verified.'}</p>}
        </section>
        <section className="space-y-3"><h2 className="font-semibold">{isRTL ? 'المستندات المطلوبة' : 'Required documents'}</h2>{required.map(type => <p key={type} className="text-sm">{isRTL ? labels[type].ar : labels[type].en}: {documents.data?.some(doc => doc.doc_type === type) ? (isRTL ? 'مرفوع' : 'Uploaded') : (isRTL ? 'مفقود' : 'Missing')}</p>)}
          {documents.data?.map(doc => <article key={doc.id} className="border rounded-xl p-4 space-y-3"><div className="flex justify-between gap-4"><h3 className="font-medium">{isRTL ? labels[doc.doc_type]?.ar : labels[doc.doc_type]?.en}</h3><span className="text-sm">{doc.status}</span></div>{doc.rejection_reason && <p className="text-sm text-destructive">{doc.rejection_reason}</p>}<div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void viewDocument(doc.storage_path)}>{isRTL ? 'عرض المستند' : 'View document'}</Button><Button size="sm" disabled={busy} onClick={() => void decideDocument(doc.id, doc.doc_type, 'approved')}>{isRTL ? 'اعتماد المستند' : 'Approve document'}</Button><Button size="sm" variant="destructive" disabled={busy} onClick={() => void decideDocument(doc.id, doc.doc_type, 'rejected')}>{isRTL ? 'رفض المستند' : 'Reject document'}</Button></div></article>)}
        </section>
      </>}
    </main>
  </div>;
}
