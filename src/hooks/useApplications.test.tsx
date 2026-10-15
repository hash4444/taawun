import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useApplyToJob, useUpdateApplication } from './useApplications';

const mocks = vi.hoisted(()=>({rpc:vi.fn(),auth:{user:{id:'student-1'},profile:{role:'worker'}}}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mocks.rpc}}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>mocks.auth}));
function wrapper({children}:{children:ReactNode}) { return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>; }

describe('authorized marketplace RPC client',()=>{
  beforeEach(()=>{mocks.rpc.mockReset();mocks.auth.profile.role='worker';});
  it('submits through the transactional RPC without trusting a supplied worker id',async()=>{
    mocks.rpc.mockResolvedValue({data:'application-1',error:null});
    const {result}=renderHook(()=>useApplyToJob(),{wrapper});
    await act(async()=>{await result.current.mutateAsync('job-1');});
    expect(mocks.rpc).toHaveBeenCalledWith('submit_application',{p_job_id:'job-1'});
    await waitFor(()=>expect(result.current.isSuccess).toBe(true));
  });
  it('rejects an employer application before calling the server',async()=>{
    mocks.auth.profile.role='business';
    const {result}=renderHook(()=>useApplyToJob(),{wrapper});
    await act(async()=>{await expect(result.current.mutateAsync('job-1')).rejects.toThrow('student account');});
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('surfaces duplicate prevention and does not report a successful submission',async()=>{
    mocks.rpc.mockResolvedValue({data:null,error:{code:'23505',message:'duplicate'}});
    const {result}=renderHook(()=>useApplyToJob(),{wrapper});
    await act(async()=>{await expect(result.current.mutateAsync('job-1')).rejects.toThrow('already applied');});
    await waitFor(()=>expect(result.current.isError).toBe(true));
  });
  it('sends interview details to the authorized transition RPC',async()=>{
    mocks.rpc.mockResolvedValue({data:{id:'application-1',status:'interview'},error:null});
    const {result}=renderHook(()=>useUpdateApplication(),{wrapper});
    await act(async()=>{await result.current.mutateAsync({id:'application-1',status:'interview',interviewAt:'2027-01-20T05:30:00Z',message:'Video interview link'});});
    expect(mocks.rpc).toHaveBeenCalledWith('update_application_status',{p_application_id:'application-1',p_status:'interview',p_interview_at:'2027-01-20T05:30:00Z',p_message:'Video interview link'});
  });
});
