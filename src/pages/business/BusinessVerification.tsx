import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Building2, 
  UserCheck, 
  Upload, 
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKYCDocuments, useUploadKYCDocument, useSubmitForVerification, validateDocument } from '@/hooks/useKYC';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type DocType = Database['public']['Enums']['doc_type'];

interface DocumentConfig {
  id: DocType;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: typeof FileText;
  acceptTypes: string;
  allowsPdf: boolean;
}

export default function BusinessVerification() {
  const { t, isRTL } = useApp();
  const { verificationStatus, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const { data: kycDocs } = useKYCDocuments();
  const uploadMutation = useUploadKYCDocument();
  const submitMutation = useSubmitForVerification();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocType | null>(null);

  const documents: DocumentConfig[] = [
    {
      id: 'commercial_reg',
      titleAr: 'السجل التجاري',
      titleEn: 'Commercial Registration',
      descAr: 'صورة واضحة من السجل التجاري الساري',
      descEn: 'Clear copy of valid commercial registration',
      icon: FileText,
      acceptTypes: 'image/jpeg,image/png,image/webp,application/pdf',
      allowsPdf: true,
    },
    {
      id: 'license',
      titleAr: 'رخصة العمل',
      titleEn: 'Operating License',
      descAr: 'رخصة مزاولة النشاط سارية المفعول',
      descEn: 'Valid operating license for your business',
      icon: Building2,
      acceptTypes: 'image/jpeg,image/png,image/webp,application/pdf',
      allowsPdf: true,
    },
    {
      id: 'rep_id',
      titleAr: 'هوية الممثل المفوض',
      titleEn: 'Authorized Rep. ID',
      descAr: 'صورة واضحة لهوية الممثل القانوني للمنشأة',
      descEn: 'Clear photo of authorized representative ID',
      icon: UserCheck,
      acceptTypes: 'image/jpeg,image/png,image/webp',
      allowsPdf: false,
    },
  ];

  const getDocStatus = (docType: DocType) => {
    const doc = kycDocs?.find(d => d.doc_type === docType);
    if (!doc) return 'not_uploaded';
    return doc.status === 'approved' ? 'verified' : doc.status === 'submitted' ? 'uploaded' : doc.status;
  };

  const getDocRejectionReason = (docType: DocType) => {
    const doc = kycDocs?.find(d => d.doc_type === docType);
    return doc?.rejection_reason || null;
  };

  const canUpload = (docType: DocType) => {
    // Can't upload if verified globally
    if (verificationStatus === 'verified') return false;
    
    const status = getDocStatus(docType);
    // Can upload if: not_uploaded, rejected
    // Cannot upload if: uploaded (pending review), verified
    return status === 'not_uploaded' || status === 'rejected';
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
    } catch (error: any) {
      toast.error(isRTL ? 'فشل رفع المستند' : 'Failed to upload document', {
        description: error.message,
      });
    }

    setSelectedDocType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync();
      await refreshProfile();
      toast.success(isRTL ? 'تم إرسال طلب التحقق' : 'Verification request submitted');
      navigate('/business/dashboard');
    } catch (error: any) {
      toast.error(isRTL ? 'فشل إرسال الطلب' : 'Failed to submit request', {
        description: error.message,
      });
    }
  };

  const allUploaded = documents.every(doc => {
    const status = getDocStatus(doc.id);
    return status === 'uploaded' || status === 'verified';
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 size={20} className="text-success" />;
      case 'rejected':
        return <AlertCircle size={20} className="text-destructive" />;
      case 'uploaded':
        return <CheckCircle2 size={20} className="text-primary" />;
      default:
        return null;
    }
  };

  return (
    <MobileLayout
      header={
        <PageHeader 
          title={t('verification')} 
          showBack 
          backPath="/business/profile" 
        />
      }
      noPadding
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Status Banner */}
      <div className="px-4 py-4">
        <div className={cn(
          'p-4 rounded-xl flex items-center gap-4',
          verificationStatus === 'verified' ? 'bg-success-light' :
          verificationStatus === 'rejected' ? 'bg-destructive-light' :
          verificationStatus === 'pending_review' ? 'bg-warning-light' :
          'bg-primary-light'
        )}>
          <StatusBadge status={verificationStatus} size="lg" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {verificationStatus === 'verified' 
                ? (isRTL ? 'تم التحقق من منشأتك بنجاح' : 'Your business is verified')
                : verificationStatus === 'pending_review'
                ? (isRTL ? 'مستنداتك قيد المراجعة' : 'Your documents are under review')
                : verificationStatus === 'rejected'
                ? (isRTL ? 'يرجى إعادة رفع المستندات المرفوضة' : 'Please re-upload rejected documents')
                : (isRTL ? 'ارفع المستندات المطلوبة للتحقق' : 'Upload required documents to verify')}
            </p>
          </div>
        </div>
      </div>

      {/* Important Instructions */}
      <div className="px-4 pb-4">
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex gap-3">
          <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              {isRTL ? 'تعليمات مهمة' : 'Important Instructions'}
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>{isRTL ? 'يجب أن تكون جميع المستندات سارية المفعول' : 'All documents must be valid and not expired'}</li>
              <li>{isRTL ? 'تأكد من وضوح الصور والنصوص' : 'Ensure images and text are clear and readable'}</li>
              <li>{isRTL ? 'يجب أن تتطابق المعلومات مع بيانات المنشأة' : 'Information must match your business details'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold mb-3">
          {isRTL ? 'المستندات المطلوبة' : 'Required Documents'}
        </h2>
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
                  'card-elevated p-4',
                  isRejected && 'border-destructive/30'
                )}
              >
                <div className="flex items-start gap-4">
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
                      <h3 className="font-medium text-foreground">
                        {isRTL ? doc.titleAr : doc.titleEn}
                      </h3>
                      {getStatusIcon(status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {isRTL ? doc.descAr : doc.descEn}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-1">
                      {doc.allowsPdf 
                        ? (isRTL ? 'صور أو PDF (حتى 15 ميجابايت)' : 'Images or PDF (up to 15MB)')
                        : (isRTL ? 'صور فقط (حتى 10 ميجابايت)' : 'Images only (up to 10MB)')}
                    </p>
                    {isRejected && rejectionReason && (
                      <p className="text-xs text-destructive mb-2">
                        {isRTL ? 'السبب: ' : 'Reason: '}{rejectionReason}
                      </p>
                    )}
                    
                    {/* Status text for non-uploadable states */}
                    {!uploadAllowed && (
                      <span className="text-sm text-primary font-medium">
                        {status === 'verified' 
                          ? (isRTL ? 'تم التحقق' : 'Verified')
                          : (isRTL ? 'تم الرفع - في انتظار المراجعة' : 'Uploaded - Pending review')}
                      </span>
                    )}
                    
                    {/* Upload button for uploadable states */}
                    {uploadAllowed && (
                      <Button
                        variant={isRejected ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleUploadClick(doc.id)}
                        disabled={uploadMutation.isPending}
                        className="gap-2 mt-2"
                      >
                        <Upload size={16} />
                        {isRejected
                          ? (isRTL ? 'إعادة الرفع' : 'Re-upload')
                          : (isRTL ? 'رفع' : 'Upload')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="px-4 pb-6">
        <Button
          onClick={handleSubmit}
          disabled={!allUploaded || verificationStatus === 'pending_review' || verificationStatus === 'verified' || submitMutation.isPending}
          className="w-full h-12"
        >
          {verificationStatus === 'pending_review' 
            ? (isRTL ? 'قيد المراجعة' : 'Under Review')
            : verificationStatus === 'verified'
            ? (isRTL ? 'تم التحقق' : 'Verified')
            : submitMutation.isPending
            ? (isRTL ? 'جاري الإرسال...' : 'Submitting...')
            : (isRTL ? 'إرسال للمراجعة' : 'Submit for Review')}
        </Button>
      </div>
    </MobileLayout>
  );
}
