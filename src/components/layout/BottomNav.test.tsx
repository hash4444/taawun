import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
const state = vi.hoisted(()=>({isRTL:false,role:'worker'}));
vi.mock('@/hooks/useApp',()=>({useApp:()=>({isRTL:state.isRTL})}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>({profile:{role:state.role}})}));
function CurrentPath(){return <output>{useLocation().pathname}</output>;}
describe('student navigation',()=>{
  it('has exactly the four core destinations and opens applications',()=>{
    state.isRTL=false;state.role='worker';
    render(<MemoryRouter><BottomNav/><CurrentPath/></MemoryRouter>);
    expect(within(screen.getByRole('navigation')).getAllByRole('button')).toHaveLength(4);
    for(const name of ['Home','Explore','Applications','Profile']) expect(screen.getByRole('button',{name})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Applications'}));
    expect(screen.getByRole('status')).toHaveTextContent('/worker/applications');
  });
  it('provides Arabic labels for the same four destinations',()=>{
    state.isRTL=true;state.role='worker';
    render(<MemoryRouter><BottomNav/></MemoryRouter>);
    const nav=screen.getByRole('navigation',{name:'التنقل الرئيسي'});
    expect(within(nav).getAllByRole('button')).toHaveLength(4);
    expect(within(nav).getByRole('button',{name:'استكشف'})).toBeInTheDocument();
    expect(within(nav).getByRole('button',{name:'طلباتي'})).toBeInTheDocument();
  });
});
