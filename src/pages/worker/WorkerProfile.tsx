import { Link, useNavigate } from 'react-router-dom';
import { User, GraduationCap, CalendarDays, FileText, Sparkles, Shield, Settings, Bell, LogOut, ChevronRight } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { MarketplaceLayout } from '@/components/marketplace/MarketplaceLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';

export default function WorkerProfile() {
  const { isRTL } = useApp();
  const { profile, studentData, verificationStatus, signOut } = useAuth();
  const navigate = useNavigate();
  const items = [
    { path:'/worker/profile/setup',icon:GraduationCap,en:'Education, skills & work preferences',ar:'الدراسة والمهارات وتفضيلات العمل' },
    { path:'/worker/availability',icon:CalendarDays,en:'Calendar & availability',ar:'التقويم وأوقات التوفر' },
    { path:'/worker/cv',icon:FileText,en:'Your CV',ar:'سيرتك الذاتية' },
    { path:'/worker/job-hunter',icon:Sparkles,en:'AI recommendations & approval settings',ar:'ترشيحات المساعد وإعدادات الموافقة' },
    { path:'/worker/verification',icon:Shield,en:'Identity verification',ar:'التحقق من الهوية' },
    { path:'/worker/notifications',icon:Bell,en:'Notifications',ar:'الإشعارات' },
    { path:'/settings',icon:Settings,en:'Language & appearance',ar:'اللغة والمظهر' },
  ];
  return <MarketplaceLayout title={isRTL ? 'ملفي الشخصي' : 'Your profile'} description={isRTL ? 'قصتك ومهاراتك، في مكان واحد.' : 'Your story, skills and preferences in one place.'}>
    <section className="card-elevated p-6 flex gap-4 items-start"><div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><User size={28} /></div><div className="min-w-0"><h2 className="text-xl font-bold">{profile?.full_name || profile?.email}</h2><p className="text-sm text-muted-foreground break-all">{profile?.email}</p>{studentData?.university && <p className="text-sm mt-2">{studentData.university}{studentData.degree ? ` · ${studentData.degree}` : ''}</p>}{studentData?.city && <p className="text-sm text-muted-foreground">{studentData.city}, UAE</p>}<StatusBadge status={verificationStatus} size="sm" className="mt-3" /></div></section>
    {!!studentData?.skills?.length && <div className="flex gap-2 flex-wrap">{studentData.skills.map(skill => <span key={skill} className="px-3 py-1 rounded-full bg-muted text-sm">{skill}</span>)}</div>}
    <div className="card-elevated divide-y divide-border">{items.map(item => <Link key={item.path} to={item.path} className="flex items-center gap-3 p-4 hover:bg-muted/50"><item.icon size={20} className="text-primary shrink-0" /><span className="flex-1 font-medium text-sm">{isRTL ? item.ar : item.en}</span><ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" /></Link>)}</div>
    <Button variant="outline" onClick={async () => { await signOut(); navigate('/auth/login'); }}><LogOut size={16} className="me-2" />{isRTL ? 'تسجيل الخروج' : 'Log out'}</Button>
  </MarketplaceLayout>;
}
