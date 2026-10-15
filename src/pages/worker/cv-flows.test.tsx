import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CVCenter from './CVCenter';
import CVPreview from './CVPreview';
import CVBuilder from './CVBuilder';

const mock = vi.hoisted(() => ({
  query: {} as Record<string, unknown>, user: { id: 'owner-id' }, save: vi.fn(), mutate: vi.fn(), removeCV: vi.fn(), upload: vi.fn(), removeFile: vi.fn(), sign: vi.fn(),
}));
vi.mock('@/hooks/useCV', () => ({ useCVRecords: () => mock.query, useDeleteCV: () => ({ mutateAsync: mock.removeCV, isPending: false }), useSaveCV: () => ({ mutateAsync: mock.save, mutate: mock.mutate, isPending: false }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mock.user, profile: { full_name: 'Saved Student', email: 'saved@example.com', city: 'Dubai', country: 'AE' }, studentData: { university: 'Example University', degree: 'Engineering', graduation_year: 2027, city: 'Dubai', skills: ['Excel'] } }) }));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ isRTL: false }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => true }));
vi.mock('@/components/layout/MobileLayout', () => ({ MobileLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/layout/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/layout/BottomNav', () => ({ BottomNav: () => null }));
vi.mock('@/components/layout/WorkerDesktopShell', () => ({ WorkerDesktopShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { storage: { from: () => ({ upload: mock.upload, remove: mock.removeFile, createSignedUrl: mock.sign }) } } }));
const cv = { id: 'cv1', user_id: 'owner-id', title: 'My private CV', updated_at: '2026-10-15', file_url: 'owner-id/file.docx', personal_info: {}, education: [], experience: [], skills: [], languages: [] };
function mount(element: ReactNode, path = '/worker/cv') { return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/worker/cv" element={element} /><Route path="/worker/cv/builder" element={element} /><Route path="/worker/cv/preview/:id" element={element} /></Routes></MemoryRouter>); }
beforeEach(() => {
  vi.clearAllMocks(); mock.query = { data: [cv], isLoading: false, error: null, refetch: vi.fn() };
  mock.upload.mockResolvedValue({ error: null }); mock.removeFile.mockResolvedValue({ error: null }); mock.sign.mockResolvedValue({ data: { signedUrl: 'https://project.supabase.co/signed-private-link' }, error: null }); mock.save.mockResolvedValue({ id: 'cv1' }); mock.removeCV.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('CV privacy and recovery interface', () => {
  it('requires a concrete deletion confirmation and supports cancel', async () => {
    mount(<CVCenter />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete CV' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument(); expect(mock.removeCV).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); expect(mock.removeCV).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete CV' })); fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));
    await waitFor(() => expect(mock.removeCV).toHaveBeenCalledWith('cv1'));
  });
  it('removes a newly uploaded private object if CV record creation fails', async () => {
    mock.save.mockRejectedValue(new Error('Database insert denied'));
    mount(<CVCenter />);
    fireEvent.change(screen.getByLabelText('Upload CV file'), { target: { files: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(mock.removeFile).toHaveBeenCalledWith([expect.stringMatching(/^owner-id\/[a-z0-9-]+\.pdf$/)]));
    expect(screen.getByRole('alert')).toHaveTextContent('Any file uploaded for this attempt was removed');
  });
  it('shows query errors and real loading states instead of empty/not-found placeholders', () => {
    mock.query = { data: undefined, isLoading: true, error: null };
    const view = mount(<CVPreview />, '/worker/cv/preview/cv1'); expect(screen.getByRole('status')).toHaveTextContent('Loading CV'); expect(screen.queryByText('CV not found')).toBeNull();
    view.unmount(); mock.query = { data: undefined, isLoading: false, error: new Error('Offline'), refetch: vi.fn() };
    mount(<CVCenter />); expect(screen.getByRole('alert')).toHaveTextContent('Could not load your CVs'); expect(screen.queryByText('No CVs yet')).toBeNull();
  });
  it('signs only owner paths and shows a Word download fallback without an unsupported iframe', async () => {
    const view = mount(<CVPreview />, '/worker/cv/preview/cv1');
    await screen.findByText('Word files cannot be previewed here. Download the file and open it in your document app.');
    expect(mock.sign).toHaveBeenCalledWith('owner-id/file.docx', 300); expect(document.querySelector('iframe')).toBeNull();
    view.unmount(); mock.query = { data: [{ ...cv, file_url: 'other-owner/file.pdf' }], isLoading: false, error: null };
    mount(<CVPreview />, '/worker/cv/preview/cv1');
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not open this private file'); expect(mock.sign).toHaveBeenCalledTimes(1);
  });
  it('prefills student education and skills and saves local summary records without an AI claim', async () => {
    mount(<CVBuilder />, '/worker/cv/builder');
    expect(screen.getByDisplayValue('Saved Student')).toBeInTheDocument(); expect(screen.getByDisplayValue('Dubai')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByDisplayValue('Example University')).toBeInTheDocument(); expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); expect(screen.getByText('Excel')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); fireEvent.click(screen.getByRole('button', { name: 'Draft summary' }));
    expect(screen.getByRole('textbox')).toHaveValue('Education: Engineering · Example University.\nSkills: Excel.');
    fireEvent.click(screen.getByRole('button', { name: 'Save & Preview' }));
    expect(mock.mutate).toHaveBeenCalledWith(expect.objectContaining({ is_ai_generated: false, education: [expect.objectContaining({ institution: 'Example University', field: 'Engineering' })], skills: ['Excel'], experience: [] }), expect.any(Object));
  });
});
