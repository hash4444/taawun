import { useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useCVRecords, useDeleteCV, useSaveCV, CVRecord } from '@/hooks/useCV';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, Plus, Trash2, Download, Eye, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function CVCenter() {
  const { isRTL } = useApp();
  const navigate = useNavigate();
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

  return (
    <MobileLayout
      header={<PageHeader title={isRTL ? 'مركز السيرة الذاتية' : 'CV Center'} showBack />}
      footer={<BottomNav />}
    >
      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => navigate('/worker/cv/builder')}
          className="h-auto py-5 flex-col gap-2"
          variant="default"
        >
          <Sparkles size={24} />
          <span className="text-sm font-medium">
            {isRTL ? 'إنشاء بالذكاء الاصطناعي' : 'AI Generate'}
          </span>
        </Button>

        <Button
          onClick={() => navigate('/worker/cv/builder')}
          className="h-auto py-5 flex-col gap-2"
          variant="outline"
        >
          <Plus size={24} />
          <span className="text-sm font-medium">
            {isRTL ? 'إنشاء يدوي' : 'Create Manually'}
          </span>
        </Button>
      </div>

      {/* CV List */}
      <h2 className="text-base font-semibold text-foreground mb-3">
        {isRTL ? 'سيرتي الذاتية' : 'My CVs'}
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !cvs?.length ? (
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
      ) : (
        <div className="space-y-3">
          {cvs.map((cv) => (
            <div key={cv.id} className="p-4 card-elevated">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{cv.title}</h3>
                  <p className="text-xs text-muted-foreground">
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
                  onClick={() => handleDelete(cv.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MobileLayout>
  );
}
