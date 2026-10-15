import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/hooks/useApp';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { Button } from '@/components/ui/button';
import { useCVRecords } from '@/hooks/useCV';
import { cvPDFSlices, privateCVPath } from '@/lib/cv';
import { toast } from '@/hooks/use-toast';

export default function CVPreview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isRTL } = useApp();
  const isMobile = useIsMobile();
  const cvRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState(false);
  const [fileRetry, setFileRetry] = useState(0);
  const { data: cvs, isLoading, error, refetch } = useCVRecords();
  const cv = cvs?.find(record => record.id === id);
  useEffect(() => {
    let cancelled = false;
    setFileUrl(null); setFileError(false);
    if (cv?.file_url) {
      let path: string;
      try { path = privateCVPath(cv.file_url, user?.id || ''); } catch { setFileError(true); return; }
      supabase.storage.from('cv_files').createSignedUrl(path, 300).then(({ data, error }) => {
        if (!cancelled) { setFileUrl(data?.signedUrl || null); setFileError(!!error || !data?.signedUrl); }
      }).catch(() => { if (!cancelled) setFileError(true); });
    }
    return () => { cancelled = true; };
  }, [cv?.file_url, user?.id, fileRetry]);
  const handleDownload = async () => {
    if (!cvRef.current || !cv) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const JsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(cvRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const pdf = new JsPDF('p', 'mm', 'a4');
      const pages = cvPDFSlices(canvas.width, canvas.height, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pages.forEach((page, index) => {
        if (index) pdf.addPage();
        const slice = document.createElement('canvas'); slice.width = canvas.width; slice.height = page.sourceHeight;
        const context = slice.getContext('2d'); if (!context) throw new Error('PDF rendering is unavailable.');
        context.drawImage(canvas, 0, page.sourceY, canvas.width, page.sourceHeight, 0, 0, canvas.width, page.sourceHeight);
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', 10, 10, page.widthMm, page.heightMm);
      });
      pdf.save(`${(cv.personal_info?.fullName || 'CV').replace(/[\\/:*?"<>|]/g, '')}.pdf`);
      toast({ title: isRTL ? 'تم تنزيل ملف PDF' : 'PDF downloaded' });
    } catch { toast({ title: isRTL ? 'تعذر إنشاء ملف PDF' : 'Could not create the PDF', variant: 'destructive' }); }
    finally { setDownloading(false); }
  };
  const frame = (content: ReactNode) => isMobile
    ? <MobileLayout header={<PageHeader title={isRTL ? 'السيرة الذاتية' : 'CV'} showBack />}><div className="py-4">{content}</div></MobileLayout>
    : <WorkerDesktopShell><div className="max-w-3xl mx-auto space-y-4">{content}</div></WorkerDesktopShell>;
  if (isLoading) return frame(<p role="status">{isRTL ? 'جارٍ تحميل السيرة الذاتية…' : 'Loading CV…'}</p>);
  if (error) return frame(<div role="alert" className="space-y-3"><p>{isRTL ? 'تعذر تحميل السيرة الذاتية.' : 'Could not load your CV.'}</p><Button onClick={() => void refetch()}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Button></div>);
  if (!cv) return frame(<p>{isRTL ? 'السيرة الذاتية غير موجودة' : 'CV not found'}</p>);
  if (cv.file_url) {
    if (!fileUrl) return frame(fileError ? <div role="alert" className="space-y-3"><p>{isRTL ? 'تعذر فتح الملف الخاص.' : 'Could not open this private file.'}</p><Button onClick={() => setFileRetry(value => value + 1)}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Button></div> : <p role="status">{isRTL ? 'جارٍ فتح الملف الخاص…' : 'Opening private file…'}</p>);
    const pdfFile = /\.pdf(?:$|[?#])/i.test(cv.file_url);
    return frame(<div className="space-y-4"><h1 className="text-xl font-bold">{cv.title}</h1><div className="flex flex-wrap gap-3"><Button asChild><a href={fileUrl} target="_blank" rel="noopener noreferrer" download>{isRTL ? 'فتح / تحميل الملف الخاص' : 'Open / download private file'}</a></Button><Button variant="outline" onClick={() => setFileRetry(value => value + 1)}>{isRTL ? 'تحديث رابط الوصول' : 'Refresh access link'}</Button></div>{pdfFile ? <iframe src={fileUrl} title={cv.title} className="w-full h-[70vh] border rounded-xl" /> : <p className="text-muted-foreground">{isRTL ? 'لا تتوفر معاينة ملفات Word داخل المتصفح. حمّل الملف وافتحه في تطبيق المستندات.' : 'Word files cannot be previewed here. Download the file and open it in your document app.'}</p>}</div>);
  }
  const info = cv.personal_info || {};
  const section = (title: string, body: ReactNode) => <section style={{ marginTop: 22 }}><h2 style={{ fontSize: 16, fontWeight: 700, color: '#087f6a', marginBottom: 10 }}>{title}</h2>{body}</section>;
  const cvDocument = <div ref={cvRef} dir={isRTL ? 'rtl' : 'ltr'} style={{ background: '#ffffff', color: '#111827', padding: 32, fontFamily: 'Arial, sans-serif', fontSize: 14, lineHeight: 1.6, overflowWrap: 'anywhere' }}>
    <header style={{ borderBottom: '2px solid #087f6a', paddingBottom: 16 }}><h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{info.fullName}</h1><p>{[info.email, info.phone].filter(Boolean).join(' · ')}</p><p>{[info.city, info.country].filter(Boolean).join(', ')}</p>{info.linkedIn && <p>{info.linkedIn}</p>}</header>
    {cv.summary && section(isRTL ? 'الملخص المهني' : 'Professional summary', <p style={{ whiteSpace: 'pre-line' }}>{cv.summary}</p>)}
    {cv.experience?.some(item => item.title || item.company || item.description) && section(isRTL ? 'الخبرة' : 'Experience', cv.experience.filter(item => item.title || item.company || item.description).map((item, index) => <div key={index} style={{ marginBottom: 14 }}><h3 style={{ fontWeight: 700 }}>{[item.title, item.company].filter(Boolean).join(' · ')}</h3><p style={{ color: '#4b5563', fontSize: 12 }}>{[item.startDate, item.current ? (isRTL ? 'حالياً' : 'Present') : item.endDate].filter(Boolean).join(' — ')}</p><p style={{ whiteSpace: 'pre-line' }}>{item.description}</p></div>))}
    {cv.education?.some(item => item.institution || item.degree || item.field) && section(isRTL ? 'التعليم' : 'Education', cv.education.filter(item => item.institution || item.degree || item.field).map((item, index) => <div key={index} style={{ marginBottom: 14 }}><h3 style={{ fontWeight: 700 }}>{[item.degree, item.field].filter(Boolean).join(' · ')}</h3><p>{item.institution}</p><p style={{ color: '#4b5563', fontSize: 12 }}>{[item.startYear, item.endYear].filter(Boolean).join(' — ')}</p></div>))}
    {!!cv.skills?.length && section(isRTL ? 'المهارات' : 'Skills', <p>{cv.skills.join(' · ')}</p>)}
    {cv.languages?.some(item => item.name) && section(isRTL ? 'اللغات' : 'Languages', <p>{cv.languages.filter(item => item.name).map(item => `${item.name}${item.level ? ` (${item.level})` : ''}`).join(' · ')}</p>)}
  </div>;
  return frame(<div className="space-y-4"><div className="flex justify-between gap-3"><h1 className="text-xl font-bold">{isRTL ? 'معاينة السيرة الذاتية' : 'CV Preview'}</h1><Button onClick={() => void handleDownload()} disabled={downloading}>{downloading ? (isRTL ? 'جارٍ التصدير…' : 'Exporting…') : (isRTL ? 'تنزيل PDF' : 'Download PDF')}</Button></div>{cvDocument}</div>);
}
