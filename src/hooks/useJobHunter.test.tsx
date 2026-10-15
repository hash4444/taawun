import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAgentSettings, useSaveAgentSettings, useJobPreferences, DEFAULT_AGENT_SETTINGS } from './useJobHunter';
const mocks=vi.hoisted(()=>({table:'',payload:null as unknown,data:null as unknown,error:null as unknown}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>({user:{id:'student-1'},studentData:{city:'Sharjah',skills:['Research'],preferred_job_types:['internship'],preferred_hours:'Weekends',updated_at:'2026-10-15'}})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
  mocks.table=table;
  const builder:Record<string,unknown>={};
  for(const name of ['select','eq'])builder[name]=()=>builder;
  builder.upsert=(payload:unknown)=>{mocks.payload=payload;return builder;};
  builder.maybeSingle=()=>Promise.resolve({data:mocks.data,error:mocks.error});
  builder.single=()=>Promise.resolve({data:mocks.payload,error:mocks.error});
  return builder;
}}}));
function wrapper({children}:{children:ReactNode}){return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}>{children}</QueryClientProvider>;}
describe('AI frontend safety settings',()=>{
  beforeEach(()=>{mocks.data=null;mocks.error=null;mocks.payload=null;});
  it('defaults to approval with automatic applications disabled',async()=>{
    const {result}=renderHook(()=>useAgentSettings(),{wrapper});
    await waitFor(()=>expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({mode:'APPROVAL',auto_apply_enabled:false,require_user_approval:true});
  });
  it('does not turn database failures into an apparently valid empty setup',async()=>{
    mocks.error=new Error('unavailable');
    const {result}=renderHook(()=>useAgentSettings(),{wrapper});
    await waitFor(()=>expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
  it('blocks automatic mode rather than trusting an environment flag',async()=>{
    const {result}=renderHook(()=>useSaveAgentSettings(),{wrapper});
    await act(async()=>{await expect(result.current.mutateAsync({...DEFAULT_AGENT_SETTINGS,mode:'AUTO',auto_apply_enabled:true})).rejects.toThrow('not enabled');});
    expect(mocks.payload).toBeNull();
  });
  it('persists pause with automatic submission disabled and the authenticated owner',async()=>{
    const {result}=renderHook(()=>useSaveAgentSettings(),{wrapper});
    await act(async()=>{await result.current.mutateAsync({...DEFAULT_AGENT_SETTINGS,paused:true,auto_apply_enabled:true});});
    expect(mocks.payload).toMatchObject({user_id:'student-1',paused:true,auto_apply_enabled:false,require_user_approval:true});
  });
  it('reuses saved student preferences and defaults pay currency to AED without requiring a CV',async()=>{
    const {result}=renderHook(()=>useJobPreferences(),{wrapper});
    await waitFor(()=>expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({locations:['Sharjah'],skills:['Research'],job_types:['internship'],availability:'Weekends',salary_currency:'AED'});
  });
});
