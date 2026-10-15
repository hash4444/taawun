import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hydrateJobBusinesses } from './publicBusinesses';
const mocks=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mocks.rpc}}));
describe('public employer summary hydration',()=>{
  beforeEach(()=>mocks.rpc.mockReset());
  it('uses one batch and copies only public fields even if a payload includes extra private data',async()=>{
    mocks.rpc.mockResolvedValue({data:[{id:'employer-1',trade_name:'Campus Employer',sector:'Technology',logo_url:null,rating_avg:null,rating_count:0,legal_name:'PRIVATE',rep_id:'SECRET',verification_reviewed_by:'ADMIN'}],error:null});
    const jobs=await hydrateJobBusinesses([{id:'job-1',business_id:'employer-1',businesses:{legal_name:'OLD CACHE'}},{id:'job-2',business_id:'employer-1'}]);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('get_public_businesses',{p_ids:['employer-1']});
    expect(jobs[0].businesses).toMatchObject({trade_name:'Campus Employer'});
    expect(jobs[0].businesses).not.toHaveProperty('legal_name');
    expect(jobs[0].businesses).not.toHaveProperty('rep_id');
    expect(jobs[0].businesses).not.toHaveProperty('verification_reviewed_by');
  });
  it('keeps a missing or unreviewed business private and makes no request for empty pages',async()=>{
    expect(await hydrateJobBusinesses([])).toEqual([]);
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.rpc.mockResolvedValue({data:[],error:null});
    expect((await hydrateJobBusinesses([{business_id:'unreviewed'}]))[0].businesses).toBeNull();
  });
  it('respects the server batch limit for a large private application list',async()=>{
    mocks.rpc.mockResolvedValue({data:[],error:null});
    await hydrateJobBusinesses(Array.from({length:120},(_,index)=>({business_id:`business-${index}`})));
    expect(mocks.rpc).toHaveBeenCalledTimes(3);
    expect(mocks.rpc.mock.calls.map(call=>call[1].p_ids.length)).toEqual([50,50,20]);
  });
  it('propagates RPC errors instead of silently falling back to a private embed',async()=>{
    mocks.rpc.mockResolvedValue({data:null,error:new Error('Unavailable')});
    await expect(hydrateJobBusinesses([{business_id:'business-1'}])).rejects.toThrow('Unavailable');
  });
});
