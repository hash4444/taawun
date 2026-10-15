import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubmitForVerification, useUpdateVerificationStatus, useApproveDocument, useRejectDocument, useUploadKYCDocument, validateDocument } from './useKYC';

const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), refresh: vi.fn(), role: 'worker' }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mock.rpc, from: mock.from } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user1' }, profile: { role: mock.role }, isAdmin: true, refreshProfile: mock.refresh }) }));
let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
beforeEach(() => { vi.clearAllMocks(); mock.role = 'worker'; mock.rpc.mockResolvedValue({ data: null, error: null }); mock.refresh.mockResolvedValue(undefined); queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } }); });
afterEach(cleanup);

describe('server-authorized verification', () => {
  it('requests server validation instead of updating verification flags directly', async () => {
    const { result } = renderHook(useSubmitForVerification, { wrapper });
    await act(async () => { await result.current.mutateAsync(); });
    expect(mock.rpc).toHaveBeenCalledWith('request_verification');
    expect(mock.from).not.toHaveBeenCalled(); expect(mock.refresh).toHaveBeenCalled();
  });
  it('uses the authenticated server actor for account review instead of client-supplied admin IDs', async () => {
    const { result } = renderHook(useUpdateVerificationStatus, { wrapper });
    await act(async () => { await result.current.mutateAsync({ userId: 'target1', role: 'business', status: 'verified', adminId: 'forged', notes: 'Reviewed licence' }); });
    expect(mock.rpc).toHaveBeenCalledWith('review_verification', { p_user_id: 'target1', p_role: 'business', p_status: 'verified', p_notes: 'Reviewed licence' });
    expect(mock.from).not.toHaveBeenCalled();
  });
  it('records document approvals and rejections through authorized RPCs', async () => {
    const approve = renderHook(useApproveDocument, { wrapper });
    const reject = renderHook(useRejectDocument, { wrapper });
    const input = { documentId: 'doc1', userId: 'target', docType: 'license', userRole: 'business' as const, adminId: 'forged' };
    await act(async () => { await approve.result.current.mutateAsync(input); await reject.result.current.mutateAsync({ ...input, rejectionReason: 'Unreadable' }); });
    expect(mock.rpc).toHaveBeenCalledWith('review_verification_document', { p_document_id: 'doc1', p_status: 'approved', p_reason: null });
    expect(mock.rpc).toHaveBeenCalledWith('review_verification_document', { p_document_id: 'doc1', p_status: 'rejected', p_reason: 'Unreadable' });
  });
  it('surfaces denied review rather than claiming success', async () => {
    mock.rpc.mockResolvedValue({ error: new Error('Administrator required') });
    const { result } = renderHook(useUpdateVerificationStatus, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync({ userId: 'target1', role: 'business', status: 'verified', adminId: 'forged' })).rejects.toThrow('Administrator required'); });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
  it('validates documents and rejects uploads for another account type before storage', async () => {
    expect(validateDocument(new File(['tiny'], 'id.png', { type: 'image/png' }), 'id_front').valid).toBe(false);
    expect(validateDocument(new File([new Uint8Array(2048)], 'id.pdf', { type: 'application/pdf' }), 'id_front').valid).toBe(false);
    const { result } = renderHook(useUploadKYCDocument, { wrapper });
    const file = new File([new Uint8Array(2048)], 'licence.pdf', { type: 'application/pdf' });
    await act(async () => { await expect(result.current.mutateAsync({ file, docType: 'license' })).rejects.toThrow('does not belong'); });
    expect(mock.from).not.toHaveBeenCalled();
  });
});
