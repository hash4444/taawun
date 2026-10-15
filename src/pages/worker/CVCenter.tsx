import { useRef, useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useCVRecords, useDeleteCV, useSaveCV, type CVRecord } from '@/hooks/useCV';
import { privateCVPath } from '@/lib/cv';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Eye, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function CVCenter() {
  const { isRTL } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: cvs, isLoading, error, refetch } = useCVRecords();
  const deleteCV = useDeleteCV();
  const saveCV = useSaveCV();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<CVRecord | null>(null);
  const [operationError, setOperationError] = useState('');
  const handleDelete = async () => {
    if (!selected) return;
    setOperationError('');
    try { await deleteCV.mutateAsync(selected.id); setSelected(null); toast({ title: isRTL ? 'تم حذف السيرة الذاتية وملفها الخاص' : 'CV and its private file deleted' }); }
    catch (failure) { setOperationError(failure instanceof Error ? failure.message : isRTL ? 'تعذر الحذف. حاول مرة أخرى.' : 'Deletion failed. Please retry.'); }
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setOperationError('');
    const extensions: Record<string, string[]> = { 'application/pdf': ['pdf'], 'application/msword': ['doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'] };
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!extensions[file.type]?.includes(extension) || file.size === 0 || file.size > 10 * 1024 * 1024) {
      setOperationError(isRTL ? 'اختر ملف PDF أو Word غير فارغ بحجم لا يتجاوز 10 ميجابايت.' : 'Choose a non-empty PDF or Word file up to 10 MB.');
      event.target.value = ''; return;
    }
    if (!user) { setOperationError(isRTL ? 'سجل الدخول أولاً.' : 'Sign in first.'); return; }
    setUploading(true); let uploadedPath: string | null = null;
    try {
      const path = privateCVPath(`${user.id}/${crypto.randomUUID()}.${extension}`, user.id);
      const { error: uploadError } = await supabase.storage.from('cv_files').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      uploadedPath = path;
      await saveCV.mutateAsync({ title: file.name.replace(/\.[^/.]+$/, ''), personal_info: {}, education: [], experience: [], skills: [], languages: [], summary: null, is_ai_generated: false, file_url: path });
      uploadedPath = null;
      toast({ title: isRTL ? 'تم رفع الملف الخاص' : 'Private CV uploaded' });
    } catch {
      let cleanupFailed = false;
      if (uploadedPath) {
        try { const { error: cleanupError } = await supabase.storage.from('cv_files').remove([privateCVPath(uploadedPath, user.id)]); cleanupFailed = !!cleanupError; }
        catch { cleanupFailed = true; }
      }
      setOperationError(cleanupFailed ? (isRTL ? 'تعذر حفظ السيرة الذاتية وإزالة الملف المرفوع. حاول مرة أخرى أو تواصل مع الدعم لحذف الملف.' : 'The CV could not be saved and its uploaded file could not be removed. Retry or contact support to remove the file.') : (isRTL ? 'تعذر حفظ السيرة الذاتية. تمت إزالة أي ملف مرفوع لهذه المحاولة.' : 'The CV could not be saved. Any file uploaded for this attempt was removed.'));
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };
  const body = <div className="space-y-6 max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
    <h1 className="text-2xl font-bold">{isRTL ? 'مركز السيرة الذاتية' : 'CV Center'}</h1>
    <p className="text-muted-foreground">{isRTL ? 'أنشئ سيرة من معلوماتك أو ارفع ملفاً خاصاً. الملفات المرفوعة لا تُحلل تلقائياً.' : 'Build a CV from your details or upload a private file. Uploaded files are not automatically parsed.'}</p>
    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" aria-label={isRTL ? 'رفع السيرة الذاتية' : 'Upload CV file'} onChange={event => void handleFileUpload(event)} />
    <div className="grid grid-cols-2 gap-3"><Button className="h-12" onClick={() => navigate('/worker/cv/builder')}><Plus size={18} className="me-2" />{isRTL ? 'إنشاء سيرة ذاتية' : 'Build a CV'}</Button><Button className="h-12" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}><Upload size={18} className="me-2" />{uploading ? (isRTL ? 'جارٍ الرفع…' : 'Uploading…') : (isRTL ? 'رفع ملف خاص' : 'Upload private file')}</Button></div>
    {operationError && <p role="alert" className="text-destructive">{operationError}</p>}
    {error ? <div role="alert" className="space-y-3"><p>{isRTL ? 'تعذر تحميل سيرك الذاتية.' : 'Could not load your CVs.'}</p><Button variant="outline" onClick={() => void refetch()}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Button></div> : isLoading ? <p role="status">{isRTL ? 'جارٍ التحميل…' : 'Loading CVs…'}</p> : !cvs?.length ? <div className="text-center py-12 text-muted-foreground"><FileText className="mx-auto mb-3" size={36} /><p>{isRTL ? 'لا توجد سيرة ذاتية بعد' : 'No CVs yet'}</p></div> : <div className="grid md:grid-cols-2 gap-4">{cvs.map(cv => <article key={cv.id} className="border rounded-xl p-4 space-y-3"><h2 className="font-semibold break-words">{cv.title}</h2><p className="text-xs text-muted-foreground">{new Date(cv.updated_at).toLocaleDateString(isRTL ? 'ar-AE' : 'en-AE')}</p><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => navigate(`/worker/cv/preview/${cv.id}`)}><Eye size={16} className="me-2" />{isRTL ? 'عرض' : 'View'}</Button><Button variant="ghost" className="text-destructive" aria-label={isRTL ? 'حذف السيرة الذاتية' : 'Delete CV'} onClick={() => { setOperationError(''); setSelected(cv); }}><Trash2 size={16} /></Button></div></article>)}</div>}
    <AlertDialog open={!!selected} onOpenChange={open => { if (!open && !deleteCV.isPending) setSelected(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{isRTL ? 'حذف السيرة الذاتية؟' : 'Delete this CV?'}</AlertDialogTitle><AlertDialogDescription>{isRTL ? 'سيُحذف السجل وأي ملف خاص مرتبط به. لا يمكن التراجع عن الحذف.' : 'This removes the CV record and its associated private file. Deletion cannot be undone.'}</AlertDialogDescription></AlertDialogHeader>{operationError && <p role="alert" className="text-destructive">{operationError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={deleteCV.isPending}>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel><AlertDialogAction disabled={deleteCV.isPending} onClick={event => { event.preventDefault(); void handleDelete(); }}>{isRTL ? 'حذف نهائي' : 'Delete permanently'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
  if (!isMobile) return <WorkerDesktopShell>{body}</WorkerDesktopShell>;
  return <MobileLayout header={<PageHeader title={isRTL ? 'السيرة الذاتية' : 'CV'} showBack />} footer={<BottomNav />}><div className="py-4">{body}</div></MobileLayout>;
}
