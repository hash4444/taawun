import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { AppProvider } from '@/contexts/AppContext';
import { LanguageSwitch } from './LanguageSwitch';
import { useApp } from '@/hooks/useApp';
function Copy(){const {t}=useApp();return <><p>{t('marketAudience')}</p><p>{t('benefit1')}</p><p>{t('benefit2')}</p><p>{t('benefit3')}</p></>;}
describe('launch languages and onboarding copy',()=>{
  beforeEach(()=>localStorage.clear());
  it('offers English and Arabic, updates RTL and keeps focus on the language control',async()=>{
    render(<AppProvider><LanguageSwitch/><Copy/></AppProvider>);
    fireEvent.click(screen.getByRole('button',{name:'Switch language'}));
    const options=screen.getByRole('group',{name:'Interface language'});
    expect(within(options).getAllByRole('button')).toHaveLength(2);
    expect(within(options).getByRole('button',{name:'English'})).toBeInTheDocument();
    fireEvent.click(within(options).getByRole('button',{name:'العربية'}));
    await waitFor(()=>expect(document.documentElement).toHaveAttribute('dir','rtl'));
    expect(document.documentElement).toHaveAttribute('lang','ar');
    expect(screen.getByRole('button',{name:'تغيير اللغة'})).toHaveFocus();
    expect(screen.getByText('لطلاب الجامعات والخريجين في الإمارات بعمر 18 سنة فأكثر')).toBeInTheDocument();
  });
  it('restores unsupported saved locales to the tested English experience',()=>{
    localStorage.setItem('taawun_language','ru');
    render(<AppProvider><LanguageSwitch/><Copy/></AppProvider>);
    expect(screen.getByText('For UAE students and fresh graduates aged 18+')).toBeInTheDocument();
    expect(screen.getByText('Use one profile for your applications')).toBeInTheDocument();
    expect(screen.getByText('Match work with a private academic timetable')).toBeInTheDocument();
    expect(screen.getByText('Review applications before they are sent')).toBeInTheDocument();
    expect(localStorage.getItem('taawun_language')).toBe('en');
  });
  it('closes the language options with Escape',()=>{
    render(<AppProvider><LanguageSwitch/></AppProvider>);
    fireEvent.click(screen.getByRole('button',{name:'Switch language'}));
    fireEvent.keyDown(document,{key:'Escape'});
    expect(screen.queryByRole('group',{name:'Interface language'})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Switch language'})).toHaveAttribute('aria-expanded','false');
  });
});
