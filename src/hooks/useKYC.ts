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
      
      if (profile.role !== 'worker' && profile.role !== 'business') throw new Error('A student or business account is required.');
      const allowed = profile.role === 'worker' ? ['id_front', 'id_back', 'selfie'] : ['commercial_reg', 'license', 'rep_id'];
      if (!allowed.includes(docType)) throw new Error('This document type does not belong to your account.');
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
          owner_role: profile.role,
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

// The server checks the complete document set and owns verification transitions.
export function useSubmitForVerification() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('request_verification');
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['kyc_documents'] });
    },
  });
}
// Include submitted documents, requested review and legacy approvals lacking review evidence.
export function usePendingVerifications() {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ['verifications', 'pending'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: docs, error } = await supabase.from('kyc_documents').select('owner_id, owner_role').eq('status', 'submitted');
      if (error) throw error;
      const filter = (role: 'worker' | 'business') => {
        const ids = [...new Set((docs || []).filter(doc => doc.owner_role === role).map(doc => doc.owner_id))];
        const states = 'verification_status.eq.pending_review,and(verification_status.eq.verified,verification_reviewed_at.is.null),and(verification_status.eq.verified,verification_reviewed_by.is.null)';
        return ids.length ? states + ',id.in.(' + ids.join(',') + ')' : states;
      };
      const [workers, businesses] = await Promise.all([
        supabase.from('workers').select('*, profiles:profiles!workers_id_fkey(id,email,full_name,phone)').or(filter('worker')),
        supabase.from('businesses').select('*, profiles:profiles!businesses_id_fkey(id,email,full_name,phone)').or(filter('business')),
      ]);
      if (workers.error) throw workers.error;
      if (businesses.error) throw businesses.error;
      return { workers: workers.data as unknown as Record<string, unknown>[], businesses: businesses.data as unknown as Record<string, unknown>[] };
    },
  });
}

// Administrative review is atomic and authorized in the database.
export function useUpdateVerificationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, status, notes }: {
      userId: string; role: 'worker' | 'business'; status: 'verified' | 'rejected'; adminId: string; notes?: string;
    }) => {
      const { error } = await supabase.rpc('review_verification', {
        p_user_id: userId, p_role: role, p_status: status, p_notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['verifications'] }),
  });
}

type DocumentReview = {
  documentId: string; userId: string; docType: string; userRole: 'worker' | 'business'; adminId: string; rejectionReason?: string;
};
function useReviewDocument(status: 'approved' | 'rejected') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, rejectionReason }: DocumentReview) => {
      const { error } = await supabase.rpc('review_verification_document', {
        p_document_id: documentId, p_status: status, p_reason: rejectionReason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc_documents'] });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });
}
export function useRejectDocument() { return useReviewDocument('rejected'); }
export function useApproveDocument() { return useReviewDocument('approved'); }
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
