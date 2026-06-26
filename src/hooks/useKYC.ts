import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type KYCDocument = Database['public']['Tables']['kyc_documents']['Row'];
type DocType = Database['public']['Enums']['doc_type'];
type DocStatus = Database['public']['Enums']['doc_status'];
type AppRole = Database['public']['Enums']['app_role'];

// Fetch user's KYC documents
export function useKYCDocuments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['kyc_documents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KYCDocument[];
    },
    enabled: !!user,
  });
}

// Document validation configuration
const DOCUMENT_VALIDATION: Record<DocType, {
  allowedMimeTypes: string[];
  maxSizeMB: number;
  requiresImage: boolean;
}> = {
  // Worker documents - require images only
  id_front: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    maxSizeMB: 10,
    requiresImage: true,
  },
  id_back: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    maxSizeMB: 10,
    requiresImage: true,
  },
  selfie: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    maxSizeMB: 10,
    requiresImage: true,
  },
  // Business documents - allow images and PDFs
  commercial_reg: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSizeMB: 15,
    requiresImage: false,
  },
  license: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxSizeMB: 15,
    requiresImage: false,
  },
  rep_id: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    maxSizeMB: 10,
    requiresImage: true,
  },
};

// Validate document file
export function validateDocument(file: File, docType: DocType): { valid: boolean; error?: string } {
  const config = DOCUMENT_VALIDATION[docType];
  
  if (!config) {
    return { valid: false, error: 'Invalid document type' };
  }

  // Check file type
  if (!config.allowedMimeTypes.includes(file.type)) {
    const allowedTypes = config.requiresImage 
      ? 'images (JPG, PNG)' 
      : 'images (JPG, PNG) or PDF';
    return { 
      valid: false, 
      error: `Invalid file type. Please upload ${allowedTypes}` 
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > config.maxSizeMB) {
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${config.maxSizeMB}MB` 
    };
  }

  // Check minimum file size (to avoid empty/corrupt files)
  if (file.size < 1024) { // Less than 1KB
    return { 
      valid: false, 
      error: 'File appears to be empty or corrupted' 
    };
  }

  return { valid: true };
}

// Upload KYC document
export function useUploadKYCDocument() {
  const queryClient = useQueryClient();
  const { user, profile, refreshProfile } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      docType 
    }: { 
      file: File; 
      docType: DocType;
    }) => {
      if (!user || !profile) throw new Error('Not authenticated');
      
      // Validate the document
      const validation = validateDocument(file, docType);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      const bucket = profile.role === 'worker' ? 'kyc_worker' : 'kyb_business';
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/${docType}_${Date.now()}.${fileExt}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;
      
      // Delete any previous document of the same type (to avoid duplicates)
      await supabase
        .from('kyc_documents')
        .delete()
        .eq('owner_id', user.id)
        .eq('doc_type', docType)
        .neq('status', 'approved'); // Don't delete approved docs
      
      // Create KYC document record
      const { data, error } = await supabase
        .from('kyc_documents')
        .insert({
          owner_id: user.id,
          owner_role: (profile.role || 'worker') as 'admin' | 'business' | 'worker',
          doc_type: docType,
          storage_path: `${bucket}/${filePath}`,
          status: 'submitted',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc_documents'] });
    },
  });
}

// Submit for verification (update status to pending_review)
export function useSubmitForVerification() {
  const queryClient = useQueryClient();
  const { user, profile, refreshProfile } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('Not authenticated');
      
      // Update worker or business verification status
      if (profile.role === 'worker') {
        const { error } = await supabase
          .from('workers')
          .update({ verification_status: 'pending_review' })
          .eq('id', user.id);
        if (error) throw error;
      } else if (profile.role === 'business') {
        const { error } = await supabase
          .from('businesses')
          .update({ verification_status: 'pending_review' })
          .eq('id', user.id);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['kyc_documents'] });
    },
  });
}

// Admin: Fetch all pending verification requests (only those with submitted documents)
export function usePendingVerifications() {
  return useQuery({
    queryKey: ['verifications', 'pending'],
    queryFn: async () => {
      // First, get all users who have at least one document with 'submitted' status
      const { data: pendingDocs, error: docsError } = await supabase
        .from('kyc_documents')
        .select('owner_id, owner_role')
        .eq('status', 'submitted');

      if (docsError) throw docsError;

      // Get unique user IDs with pending documents
      const workerIds = [...new Set(
        pendingDocs?.filter(d => d.owner_role === 'worker').map(d => d.owner_id) || []
      )];
      const businessIds = [...new Set(
        pendingDocs?.filter(d => d.owner_role === 'business').map(d => d.owner_id) || []
      )];

      // Fetch workers with pending documents
      let workers: Record<string, unknown>[] = [];
      if (workerIds.length > 0) {
        const { data, error } = await supabase
          .from('workers')
          .select(`
            *,
            profiles:profiles!workers_id_fkey (
              id,
              email,
              full_name,
              phone
            )
          `)
          .in('id', workerIds);

        if (error) throw error;
        workers = data || [];
      }

      // Fetch businesses with pending documents
      let businesses: Record<string, unknown>[] = [];
      if (businessIds.length > 0) {
        const { data, error } = await supabase
          .from('businesses')
          .select(`
            *,
            profiles:profiles!businesses_id_fkey (
              id,
              email,
              full_name,
              phone
            )
          `)
          .in('id', businessIds);

        if (error) throw error;
        businesses = data || [];
      }

      return {
        workers,
        businesses,
      };
    },
  });
}

// Admin: Approve/Reject verification
export function useUpdateVerificationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      role, 
      status,
      adminId,
      notes,
    }: { 
      userId: string; 
      role: 'worker' | 'business';
      status: 'verified' | 'rejected';
      adminId: string;
      notes?: string;
    }) => {
      // Update verification status
      if (role === 'worker') {
        const { error } = await supabase
          .from('workers')
          .update({ verification_status: status })
          .eq('id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('businesses')
          .update({ verification_status: status })
          .eq('id', userId);
        if (error) throw error;
      }

      // Log admin action
      const { error: actionError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          target_type: role,
          target_id: userId,
          action: status === 'verified' ? 'approve_verification' : 'reject_verification',
          notes,
        });

      if (actionError) throw actionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
}

// Admin: Reject a specific document and send email
export function useRejectDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      documentId,
      userId,
      docType,
      userRole,
      adminId,
      rejectionReason,
    }: { 
      documentId: string;
      userId: string;
      docType: string;
      userRole: 'worker' | 'business';
      adminId: string;
      rejectionReason?: string;
    }) => {
      // Update document status to rejected
      const { error: docError } = await supabase
        .from('kyc_documents')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        })
        .eq('id', documentId);

      if (docError) throw docError;

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          target_type: 'document',
          target_id: documentId,
          action: 'reject_document',
          notes: rejectionReason,
        });

      // Send rejection email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
        body: {
          userId,
          documentType: docType,
          userRole,
          action: 'rejected',
          rejectionReason,
        },
      });

      if (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Don't throw - document was rejected, email is secondary
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc_documents'] });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
}

// Required documents per role
const REQUIRED_DOCS: Record<'worker' | 'business', string[]> = {
  worker: ['id_front', 'id_back', 'selfie'],
  business: ['commercial_reg', 'license', 'rep_id'],
};

// Admin: Approve a specific document
export function useApproveDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      documentId,
      userId,
      docType,
      userRole,
      adminId,
    }: { 
      documentId: string;
      userId: string;
      docType: string;
      userRole: 'worker' | 'business';
      adminId: string;
    }) => {
      // Update document status to approved
      const { error: docError } = await supabase
        .from('kyc_documents')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        })
        .eq('id', documentId);

      if (docError) throw docError;

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: adminId,
          target_type: 'document',
          target_id: documentId,
          action: 'approve_document',
        });

      // Check if ALL required documents are now approved for this user
      const { data: allDocs, error: docsError } = await supabase
        .from('kyc_documents')
        .select('doc_type, status')
        .eq('owner_id', userId);

      if (docsError) throw docsError;

      const requiredDocs = REQUIRED_DOCS[userRole];
      const allApproved = requiredDocs.every(reqDoc => 
        allDocs?.some(d => d.doc_type === reqDoc && d.status === 'approved')
      );

      // If all required documents are approved, update the user's verification status
      if (allApproved) {
        if (userRole === 'worker') {
          const { error: updateError } = await supabase
            .from('workers')
            .update({ verification_status: 'verified' })
            .eq('id', userId);
          if (updateError) throw updateError;
        } else {
          const { error: updateError } = await supabase
            .from('businesses')
            .update({ verification_status: 'verified' })
            .eq('id', userId);
          if (updateError) throw updateError;
        }

        // Log the verification approval
        await supabase
          .from('admin_actions')
          .insert({
            admin_id: adminId,
            target_type: userRole,
            target_id: userId,
            action: 'approve_verification',
            notes: 'Auto-verified after all documents approved',
          });
      }

      // Send approval email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
        body: {
          userId,
          documentType: docType,
          userRole,
          action: 'approved',
          allDocsApproved: allApproved,
        },
      });

      if (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't throw - document was approved, email is secondary
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc_documents'] });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
}

// Fetch documents for a specific user (admin use)
export function useUserDocuments(userId: string | undefined) {
  return useQuery({
    queryKey: ['kyc_documents', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KYCDocument[];
    },
    enabled: !!userId,
  });
}
