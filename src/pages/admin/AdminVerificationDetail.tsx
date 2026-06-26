import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUserDocuments, useApproveDocument, useRejectDocument } from '@/hooks/useKYC';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, FileText, User, Building2, ExternalLink } from 'lucide-react';

const DOC_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  id_front: { en: 'ID Front', ar: 'الهوية (أمام)' },
  id_back: { en: 'ID Back', ar: 'الهوية (خلف)' },
  selfie: { en: 'Selfie', ar: 'صورة شخصية' },
  commercial_reg: { en: 'Commercial Registration', ar: 'السجل التجاري' },
  license: { en: 'License', ar: 'الرخصة' },
  rep_id: { en: 'Representative ID', ar: 'هوية المفوض' },
};

export default function AdminVerificationDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isRTL } = useApp();
  const { user } = useAuth();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; type: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: documents, isLoading: docsLoading } = useUserDocuments(userId);
  const approveMutation = useApproveDocument();
  const rejectMutation = useRejectDocument();

  // Fetch user profile info
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Check if worker or business
      const { data: worker } = await supabase
        .from('workers')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', userId)
        .single();
      
      return {
        profile,
        worker,
        business,
        type: worker ? 'worker' : business ? 'business' : null,
      };
    },
    enabled: !!userId,
  });

  const handleApprove = async (documentId: string, docType: string) => {
    if (!user || !userId || !profileData?.type) return;
    try {
      await approveMutation.mutateAsync({ 
        documentId, 
        userId,
        docType,
        userRole: profileData.type as 'worker' | 'business',
        adminId: user.id 
      });
      toast.success(isRTL ? 'تمت الموافقة على المستند' : 'Document approved');
    } catch (error) {
      toast.error(isRTL ? 'فشل في الموافقة' : 'Failed to approve');
    }
  };

  const openRejectDialog = (documentId: string, docType: string) => {
    setSelectedDoc({ id: documentId, type: docType });
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!user || !selectedDoc || !userId || !profileData) return;
    
    try {
      await rejectMutation.mutateAsync({
        documentId: selectedDoc.id,
        userId,
        docType: selectedDoc.type,
        userRole: profileData.type as 'worker' | 'business',
        adminId: user.id,
        rejectionReason: rejectionReason || undefined,
      });
      toast.success(isRTL ? 'تم رفض المستند وإرسال الإشعار' : 'Document rejected and notification sent');
      setRejectDialogOpen(false);
    } catch (error) {
      toast.error(isRTL ? 'فشل في الرفض' : 'Failed to reject');
    }
  };

  const getDocumentUrl = async (storagePath: string) => {
    const [bucket, ...pathParts] = storagePath.split('/');
    const filePath = pathParts.join('/');
    
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      toast.error(isRTL ? 'فشل في فتح المستند' : 'Failed to open document');
    }
  };

  const isLoading = docsLoading || profileLoading;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader 
        title={isRTL ? 'تفاصيل التحقق' : 'Verification Details'} 
        showBack 
        backPath="/admin/verifications" 
      />
      <div className="px-4 py-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-muted rounded-xl animate-pulse" />
            <div className="h-32 bg-muted rounded-xl animate-pulse" />
          </div>
        ) : !profileData?.profile ? (
          <p className="text-center text-muted-foreground py-12">
            {isRTL ? 'المستخدم غير موجود' : 'User not found'}
          </p>
        ) : (
          <>
            {/* User Info Card */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                  {profileData.type === 'worker' ? (
                    <User size={24} className="text-primary" />
                  ) : (
                    <Building2 size={24} className="text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-card-title">
                    {profileData.profile.full_name || profileData.profile.email}
                  </p>
                  <p className="text-body text-muted-foreground">{profileData.profile.email}</p>
                  <p className="text-caption text-muted-foreground">
                    {profileData.type === 'worker'
                      ? (isRTL ? 'عامل' : 'Worker')
                      : (isRTL ? 'منشأة' : 'Business')}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h2 className="font-semibold mb-3">
                {isRTL ? 'المستندات المرفوعة' : 'Uploaded Documents'}
              </h2>
              
              {!documents || documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {isRTL ? 'لا توجد مستندات' : 'No documents uploaded'}
                </p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="card-elevated p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {DOC_TYPE_LABELS[doc.doc_type]?.[isRTL ? 'ar' : 'en'] || doc.doc_type}
                            </p>
                            <p className="text-caption text-muted-foreground">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            doc.status === 'approved' ? 'default' : 
                            doc.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {doc.status === 'approved' 
                            ? (isRTL ? 'مقبول' : 'Approved')
                            : doc.status === 'rejected'
                            ? (isRTL ? 'مرفوض' : 'Rejected')
                            : (isRTL ? 'قيد المراجعة' : 'Pending')}
                        </Badge>
                      </div>

                      {doc.rejection_reason && (
                        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded mb-3">
                          <span className="font-medium">{isRTL ? 'سبب الرفض:' : 'Rejection reason:'}</span>{' '}
                          {doc.rejection_reason}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => getDocumentUrl(doc.storage_path)}
                        >
                          <ExternalLink size={14} className="me-1" />
                          {isRTL ? 'عرض' : 'View'}
                        </Button>
                        
                        {doc.status === 'submitted' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(doc.id, doc.doc_type)}
                              disabled={approveMutation.isPending}
                            >
                              <Check size={14} className="me-1" />
                              {isRTL ? 'قبول' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(doc.id, doc.doc_type)}
                              disabled={rejectMutation.isPending}
                            >
                              <X size={14} className="me-1" />
                              {isRTL ? 'رفض' : 'Reject'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'رفض المستند' : 'Reject Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              {isRTL ? 'سبب الرفض (اختياري)' : 'Rejection Reason (optional)'}
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={isRTL ? 'مثال: الصورة غير واضحة' : 'e.g., Image is blurry'}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {isRTL ? 'تأكيد الرفض' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
