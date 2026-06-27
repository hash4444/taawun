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
import { useCVRecords, useDeleteCV, useSaveCV, CVRecord } from '@/hooks/useCV';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, Plus, Trash2, Download, Eye, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function CVCenter() {
  const { isRTL } = useApp();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: cvs, isLoading } = useCVRecords();
  const deleteCV = useDeleteCV();
  const saveCV = useSaveCV();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleDelete = (id: string) => {
    deleteCV.mutate(id, {
      onSuccess: () => toast({ title: isRTL ? 'تم الحذف' : 'CV deleted' }),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({ title: isRTL ? 'نوع ملف غير مدعوم' : 'Unsupported file type', description: isRTL ? 'يرجى رفع ملف PDF أو Word' : 'Please upload a PDF or Word file', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: isRTL ? 'الملف كبير جداً' : 'File too large', description: isRTL ? 'الحد الأقصى 10 ميجابايت' : 'Maximum 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cv_files')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('cv_files')
        .getPublicUrl(filePath);

      const fileName = file.name.replace(/\.[^/.]+$/, '');
      await saveCV.mutateAsync({
        title: fileName,
        personal_info: {},
        education: [],
        experience: [],
        skills: [],
        languages: [],
        summary: null,
        is_ai_generated: false,
        file_url: urlData.publicUrl,
      });
      toast({ title: isRTL ? 'تم رفع السيرة الذاتية' : 'CV uploaded successfully' });
    } catch {
      toast({ title: isRTL ? 'فشل الرفع' : 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf,.doc,.docx"
      className="hidden"
      onChange={handleFileUpload}
    />
  );

  const actionButtons = (gridCols: string) => (
    <div className={`grid ${gridCols} gap-3`}>
      <Button
        onClick={() => navigate('/worker/cv/builder')}
        className="h-auto py-5 flex-col gap-2"
        variant="default"
      >
        <Sparkles size={24} />
        <span className="text-xs font-medium">
          {isRTL ? 'ذكاء اصطناعي' : 'AI Generate'}
        </span>
      </Button>

      <Button
        onClick={() => navigate('/worker/cv/builder')}
        className="h-auto py-5 flex-col gap-2"
        variant="outline"
      >
        <Plus size={24} />
        <span className="text-xs font-medium">
          {isRTL ? 'إنشاء يدوي' : 'Create Manual'}
        </span>
      </Button>

      <Button
        onClick={() => fileInputRef.current?.click()}
        className="h-auto py-5 flex-col gap-2"
        variant="outline"
        disabled={uploading}
      >
        <Upload size={24} />
        <span className="text-xs font-medium">
          {uploading ? (isRTL ? 'جاري الرفع...' : 'Uploading...') : (isRTL ? 'رفع ملف' : 'Upload File')}
        </span>
      </Button>
    </div>
  );

  const cvList = (cardGridCols?: string) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    if (!cvs?.length) {
      return (
        <div className="text-center py-16 px-4">
          <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {isRTL ? 'لا توجد سيرة ذاتية بعد' : 'No CVs yet'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL
              ? 'أنشئ سيرتك الذاتية بالذكاء الاصطناعي'
              : 'Generate your first CV with AI'}
          </p>
        </div>
      );
    }

    return (
      <div className={cardGridCols ? `grid ${cardGridCols} gap-3` : 'space-y-3'}>
        {cvs.map((cv) => (
          <div key={cv.id} className="p-4 card-elevated">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{cv.title}</h3>
                <p className="text-caption text-muted-foreground">
                  {format(new Date(cv.updated_at), 'dd MMM yyyy')}
                  {cv.is_ai_generated && (
                    <span className="ms-2 text-primary">✨ AI</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/worker/cv/preview/${cv.id}`)}
              >
                <Eye size={14} className="me-1" />
                {isRTL ? 'عرض' : 'View'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                aria-label={isRTL ? 'حذف السيرة الذاتية' : 'Delete CV'}
                onClick={() => handleDelete(cv.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        {fileInput}
        <div className="space-y-6 max-w-5xl mx-auto">
          <h1 className="text-page-title text-foreground">
            {isRTL ? 'مركز السيرة الذاتية' : 'CV Center'}
          </h1>

          {actionButtons('grid-cols-3')}

          <div>
            <h2 className="text-card-title font-semibold text-foreground mb-3">
              {isRTL ? 'سيرتي الذاتية' : 'My CVs'}
            </h2>
            {cvList('grid-cols-2')}
          </div>
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={<PageHeader title={isRTL ? 'مركز السيرة الذاتية' : 'CV Center'} showBack />}
      footer={<BottomNav />}
    >
      {fileInput}
      <div className="mb-6">
        {actionButtons('grid-cols-3')}
      </div>

      {/* CV List */}
      <h2 className="text-base font-semibold text-foreground mb-3">
        {isRTL ? 'سيرتي الذاتية' : 'My CVs'}
      </h2>

      {cvList()}
    </MobileLayout>
  );
}
