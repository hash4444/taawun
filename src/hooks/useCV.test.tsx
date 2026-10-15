import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeleteCV, useSaveCV } from './useCV';

const mock = vi.hoisted(() => ({ cv: { id: 'cv1', user_id: 'owner-id', file_url: 'owner-id/file.pdf' } as Record<string, unknown>, storageError: null as Error | null, deleteError: null as Error | null, remove: vi.fn(), insert: vi.fn(), sequence: [] as string[] }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'owner-id' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => {
    let deleting = false;
    const chain = {
      select: () => chain, eq: () => chain,
      delete: () => { deleting = true; mock.sequence.push('record'); return chain; },
      insert: (value: unknown) => { mock.insert(value); return chain; },
      single: async () => ({ data: mock.cv, error: deleting ? mock.deleteError : null }),
    };
    return chain;
  },
  storage: { from: () => ({ remove: mock.remove }) },
} }));
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks(); mock.sequence = []; mock.cv = { id: 'cv1', user_id: 'owner-id', file_url: 'owner-id/file.pdf' }; mock.storageError = null; mock.deleteError = null;
  mock.remove.mockImplementation(async () => { mock.sequence.push('file'); return { error: mock.storageError }; });
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
});
afterEach(cleanup);
describe('private CV deletion', () => {
  it('removes the owner file before its record and invalidates records', async () => {
    const { result } = renderHook(useDeleteCV, { wrapper });
    await act(async () => { await result.current.mutateAsync('cv1'); });
    expect(mock.remove).toHaveBeenCalledWith(['owner-id/file.pdf']); expect(mock.sequence).toEqual(['file', 'record']);
  });
  it('never removes another account file even if an own record points to it', async () => {
    mock.cv.file_url = 'other-id/file.pdf';
    const { result } = renderHook(useDeleteCV, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync('cv1')).rejects.toThrow('another account'); });
    expect(mock.remove).not.toHaveBeenCalled(); expect(mock.sequence).toEqual([]);
  });
  it('keeps the record when storage cleanup fails and explains partial database deletion failures', async () => {
    mock.storageError = new Error('Storage unavailable');
    const { result } = renderHook(useDeleteCV, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync('cv1')).rejects.toThrow('record was kept'); });
    expect(mock.sequence).toEqual(['file']);
    mock.storageError = null; mock.deleteError = new Error('Database unavailable');
    await act(async () => { await expect(result.current.mutateAsync('cv1')).rejects.toThrow('Retry to finish deletion'); });
  });
  it('deletes manually built records without touching storage', async () => {
    mock.cv.file_url = null;
    const { result } = renderHook(useDeleteCV, { wrapper });
    await act(async () => { await result.current.mutateAsync('cv1'); });
    expect(mock.remove).not.toHaveBeenCalled(); expect(mock.sequence).toEqual(['record']);
  });
  it('persists the private file reference when creating a CV record', async () => {
    const { result } = renderHook(useSaveCV, { wrapper });
    await act(async () => { await result.current.mutateAsync({ title: 'My CV', personal_info: {}, education: [], experience: [], skills: [], languages: [], summary: null, is_ai_generated: false, file_url: 'owner-id/file.pdf' }); });
    expect(mock.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'owner-id', file_url: 'owner-id/file.pdf', is_ai_generated: false }));
  });
});
