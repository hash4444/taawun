import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMarketplaceJobs } from './useMarketplaceJobs';
const mocks = vi.hoisted(()=>({calls:[] as unknown[][]}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
  mocks.calls.push(['from',table]);
  const builder: Record<string,unknown> = {};
  for(const name of ['select','eq','gt','or','order','ilike','gte']) builder[name]=(...args:unknown[])=>{mocks.calls.push([name,...args]);return builder;};
  builder.range=(...args:unknown[])=>{mocks.calls.push(['range',...args]);return Promise.resolve({data:[],count:25,error:null});};
  return builder;
}}}));
function wrapper({children}:{children:ReactNode}) {return <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{children}</QueryClientProvider>;}
describe('job discovery query contract',()=>{
  beforeEach(()=>{mocks.calls.length=0;});
  it('fetches only active UAE student opportunities and uses an inclusive bounded page',async()=>{
    const {result}=renderHook(()=>useMarketplaceJobs({page:1,pageSize:12}),{wrapper});
    await waitFor(()=>expect(result.current.isSuccess).toBe(true));
    expect(mocks.calls).toContainEqual(['eq','status','open']);
    expect(mocks.calls).toContainEqual(['eq','country','AE']);
    expect(mocks.calls).toContainEqual(['eq','currency','AED']);
    expect(mocks.calls).toContainEqual(['eq','student_friendly',true]);
    expect(mocks.calls).toContainEqual(['range',12,23]);
    expect(mocks.calls.some(call=>call[0]==='gt'&&call[1]==='end_time')).toBe(true);
    expect(result.current.data?.count).toBe(25);
  });
  it('applies real location, job type, pay period, pay and remote filters',async()=>{
    const {result}=renderHook(()=>useMarketplaceJobs({query:'intern,(status.eq.closed)',location:'Dubai',type:'part_time',minimumPay:25,paymentModel:'hourly',remoteOnly:true}),{wrapper});
    await waitFor(()=>expect(result.current.isSuccess).toBe(true));
    expect(mocks.calls).toContainEqual(['eq','job_type','part_time']);
    expect(mocks.calls).toContainEqual(['or','location.eq.Dubai,address.ilike.%Dubai%']);
    expect(mocks.calls).toContainEqual(['eq','remote_allowed',true]);
    expect(mocks.calls).toContainEqual(['eq','payment_model','hourly']);
    expect(mocks.calls).toContainEqual(['gte','pay_amount',25]);
    const search = mocks.calls.find(call=>call[0]==='or'&&String(call[1]).includes('title.ilike'));
    expect(String(search?.[1])).not.toContain('(status.eq.closed)');
  });
});
