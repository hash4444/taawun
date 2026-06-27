import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  CreditCard, 
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Camera,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKYCDocuments, useUploadKYCDocument, useSubmitForVerification, validateDocument } from '@/hooks/useKYC';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type DocType = Database['public']['Enums']['doc_type'];

interface DocumentUpload {
  id: DocType;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: React.ElementType;
  acceptTypes: string;
}

export default function WorkerVerification() {
  const { t, isRTL } = useApp();
  const { verificationStatus, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: kycDocs, isLoading } = useKYCDocuments();
  const uploadMutation = useUploadKYCDocument();
  const submitMutation = useSubmitForVerification();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocType | null>(null);

  const documents: DocumentUpload[] = [
    { 
      id: 'id_front', 
      labelAr: 'صورة الهوية (الأمام)',
      labelEn: 'ID Card (Front)',
      descAr: 'صورة واضحة للوجه الأمامي للهوية',
      descEn: 'Clear photo of the front side of your ID',
      icon: CreditCard,
      acceptTypes: 'image/jpeg,image/png,image/webp',
    },
    { 
      id: 'id_back', 
      labelAr: 'صورة الهوية (الخلف)',
      labelEn: 'ID Card (Back)',
      descAr: 'صورة واضحة للوجه الخلفي للهوية',
      descEn: 'Clear photo of the back side of your ID',
      icon: CreditCard,
      acceptTypes: 'image/jpeg,image/png,image/webp',
    },
    { 
      id: 'selfie', 
      labelAr: 'صورة شخصية',
      labelEn: 'Selfie Photo',
      descAr: 'صورة واضحة لوجهك وأنت تحمل هويتك',
      descEn: 'Clear photo of yourself holding your ID',
      icon: Camera,
      acceptTypes: 'image/jpeg,image/png,image/webp',
    },
  ];

  const getDocStatus = (docType: DocType) => {
    const doc = kycDocs?.find(d => d.doc_type === docType);
    if (!doc) return 'not_started';
    return doc.status === 'approved' ? 'verified' : doc.status === 'submitted' ? 'uploaded' : doc.status;
  };

  const getDocRejectionReason = (docType: DocType) => {
    const doc = kycDocs?.find(d => d.doc_type === docType);
    return doc?.rejection_reason || null;
  };

  const canUpload = (docType: DocType) => {
    // Can always upload if verified globally - don't allow changes
    if (verificationStatus === 'verified') return false;
    
    const status = getDocStatus(docType);
    // Can upload if: not started, rejected
    // Cannot upload if: uploaded (pending review), verified
    return status === 'not_started' || status === 'rejected';
  };

  const handleUploadClick = (docType: DocType) => {
    if (!canUpload(docType)) return;
    setSelectedDocType(docType);
    
    // Update file input accept types based on document
    const doc = documents.find(d => d.id === docType);
    if (fileInputRef.current && doc) {
      fileInputRef.current.accept = doc.acceptTypes;
    }
    
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType) return;

    // Validate the file before uploading
    const validation = validateDocument(file, selectedDocType);
    if (!validation.valid) {
      toast.error(isRTL ? 'ملف غير صالح' : 'Invalid file', {
        description: validation.error,
      });
      setSelectedDocType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      await uploadMutation.mutateAsync({ file, docType: selectedDocType });
      toast.success(isRTL ? 'تم رفع المستند بنجاح' : 'Document uploaded successfully');
    } catch (error: unknown) {
      toast.error(isRTL ? 'فشل رفع المستند' : 'Failed to upload document', {
        description: error instanceof Error ? error.message : String(error),
      });
    }

    // Reset
    setSelectedDocType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync();
      await refreshProfile();
      toast.success(isRTL ? 'تم إرسال طلب التحقق' : 'Verification request submitted');
      navigate('/worker/home');
    } catch (error: unknown) {
      toast.error(isRTL ? 'فشل إرسال الطلب' : 'Failed to submit request', {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const allUploaded = documents.every(d => {
    const status = getDocStatus(d.id);
    return status === 'uploaded' || status === 'verified';
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
      case 'verified':
        return <CheckCircle size={20} className="text-success" />;
      case 'rejected':
        return <AlertCircle size={20} className="text-destructive" />;
      default:
        return <Upload size={20} className="text-muted-foreground" />;
    }
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      capture="environment"
      onChange={handleFileChange}
      className="hidden"
    />
  );

  const statusBanner = (
    <div className={cn(
      'p-4 rounded-xl flex items-center gap-4',
      verificationStatus === 'verified' && 'bg-success-light',
      verificationStatus === 'pending_review' && 'bg-warning-light',
      verificationStatus === 'rejected' && 'bg-destructive-light',
      verificationStatus === 'not_started' && 'bg-muted'
    )}>
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center',
        verificationStatus === 'verified' && 'bg-success/20',
        verificationStatus === 'pending_review' && 'bg-warning/20',
        verificationStatus === 'rejected' && 'bg-destructive/20',
        verificationStatus === 'not_started' && 'bg-muted-foreground/20'
      )}>
        {verificationStatus === 'verified' && <CheckCircle size={24} className="text-success" />}
        {verificationStatus === 'pending_review' && <Clock size={24} className="text-warning" />}
        {verificationStatus === 'rejected' && <AlertCircle size={24} className="text-destructive" />}
        {verificationStatus === 'not_started' && <Upload size={24} className="text-muted-foreground" />}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-card-title text-foreground">
          {verificationStatus === 'verified' && (isRTL ? 'تم التحقق' : 'Verified')}
          {verificationStatus === 'pending_review' && (isRTL ? 'جاري المراجعة' : 'Under Review')}
          {verificationStatus === 'rejected' && (isRTL ? 'مرفوض' : 'Rejected')}
          {verificationStatus === 'not_started' && (isRTL ? 'لم يبدأ' : 'Not Started')}
        </h3>
        <p className="text-body text-muted-foreground">
          {verificationStatus === 'not_started'
            ? (isRTL ? 'ارفع مستنداتك للتحقق' : 'Upload your documents to verify')
            : verificationStatus === 'pending_review'
              ? (isRTL ? 'سنراجع مستنداتك قريباً' : "We'll review your documents soon")
              : verificationStatus === 'verified'
                ? (isRTL ? 'يمكنك الآن التقديم على الورديات' : 'You can now apply for shifts')
                : (isRTL ? 'يرجى إعادة رفع المستندات' : 'Please re-upload your documents')
          }
        </p>
      </div>
    </div>
  );

  const instructionsBlock = (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex gap-3">
      <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
      <div className="text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">
          {isRTL ? 'تعليمات مهمة' : 'Important Instructions'}
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>{isRTL ? 'تأكد من وضوح الصور والمعلومات' : 'Ensure photos are clear and readable'}</li>
          <li>{isRTL ? 'يجب أن تكون الهوية سارية المفعول' : 'ID must be valid and not expired'}</li>
          <li>{isRTL ? 'الصورة الشخصية يجب أن تظهر وجهك وهويتك' : 'Selfie must show your face and ID together'}</li>
        </ul>
      </div>
    </div>
  );

  const documentsList = (
    <div className="space-y-3">
      {documents.map((doc) => {
        const status = getDocStatus(doc.id);
        const isRejected = status === 'rejected';
        const rejectionReason = getDocRejectionReason(doc.id);
        const uploadAllowed = canUpload(doc.id);

        return (
          <div
            key={doc.id}
            className={cn(
              'p-4 card-elevated',
              isRejected && 'border-destructive/30'
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                status === 'uploaded' || status === 'verified'
                  ? 'bg-success-light'
                  : isRejected
                  ? 'bg-destructive-light'
                  : 'bg-primary-light'
              )}>
                <doc.icon size={24} className={cn(
                  status === 'uploaded' || status === 'verified'
                    ? 'text-success'
                    : isRejected
                    ? 'text-destructive'
                    : 'text-primary'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">
                    {isRTL ? doc.labelAr : doc.labelEn}
                  </p>
                  {getStatusIcon(status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {status === 'uploaded'
                    ? (isRTL ? 'تم الرفع - في انتظار المراجعة' : 'Uploaded - Pending review')
                    : status === 'verified'
                      ? (isRTL ? 'تم التحقق' : 'Verified')
                      : isRejected
                        ? (isRTL ? 'مرفوض - يرجى إعادة الرفع' : 'Rejected - Please re-upload')
                        : (isRTL ? doc.descAr : doc.descEn)
                  }
                </p>
                {isRejected && rejectionReason && (
                  <p className="text-xs text-destructive mt-1">
                    {isRTL ? 'السبب: ' : 'Reason: '}{rejectionReason}
                  </p>
                )}
              </div>
            </div>

            {/* Upload/Re-upload Button */}
            {uploadAllowed && (
              <Button
                onClick={() => handleUploadClick(doc.id)}
                disabled={uploadMutation.isPending}
                variant={isRejected ? 'destructive' : 'outline'}
                size="sm"
                className="mt-3 w-full gap-2"
              >
                <Upload size={16} />
                {isRejected
                  ? (isRTL ? 'إعادة الرفع' : 'Re-upload')
                  : (isRTL ? 'رفع' : 'Upload')}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );

  const submitButton = (verificationStatus === 'not_started' || verificationStatus === 'rejected') && (
    <Button
      onClick={handleSubmit}
      disabled={!allUploaded || submitMutation.isPending}
      className="w-full h-14 mt-6 text-lg font-semibold"
      size="lg"
    >
      {submitMutation.isPending ? t('loading') : t('submit')}
    </Button>
  );

  const fileRequirementsNote = (
    <p className="text-xs text-muted-foreground mt-4 text-center">
      {isRTL
        ? 'الملفات المقبولة: JPG, PNG (الحد الأقصى 10 ميجابايت)'
        : 'Accepted files: JPG, PNG (max 10MB)'}
    </p>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-page-title text-foreground">{t('verification')}</h1>

          {fileInput}
          {statusBanner}
          {instructionsBlock}

          <div>
            <h2 className="text-card-title font-semibold text-foreground mb-4">
              {isRTL ? 'المستندات المطلوبة' : 'Required Documents'}
            </h2>
            {documentsList}
            {fileRequirementsNote}
            {submitButton}
          </div>
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={<PageHeader title={t('verification')} showBack />}
      noPadding
    >
      {fileInput}

      {/* Status Banner */}
      <div className="px-4 py-4">
        {statusBanner}
      </div>

      {/* Important Instructions */}
      <div className="px-4 pb-4">
        {instructionsBlock}
      </div>

      {/* Document Uploads */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {isRTL ? 'المستندات المطلوبة' : 'Required Documents'}
        </h2>

        {documentsList}
        {fileRequirementsNote}
        {submitButton}
      </div>
    </MobileLayout>
  );
}
