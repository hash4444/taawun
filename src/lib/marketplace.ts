import type { Database } from '@/integrations/supabase/types';

export type ApplicationStatus = Database['public']['Enums']['application_status'];
export type MarketplaceRole = 'worker' | 'business';
export const APPLICATION_LABELS: Record<string, { en: string; ar: string }> = {
  applied: { en: 'Submitted', ar: 'تم التقديم' },
  shortlisted: { en: 'Shortlisted', ar: 'القائمة المختصرة' },
  interview: { en: 'Interview invited', ar: 'دعوة للمقابلة' },
  offered: { en: 'Offer received', ar: 'عرض عمل' },
  accepted: { en: 'Offer accepted', ar: 'تم قبول العرض' },
  placed: { en: 'Placement confirmed', ar: 'تم تأكيد التوظيف' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  rejected: { en: 'Not selected', ar: 'لم يتم الاختيار' },
  cancelled: { en: 'Withdrawn', ar: 'تم سحب الطلب' },
};

// UI affordances mirror the database transition rules. The RPC remains authoritative.
export function applicationActions(role: MarketplaceRole, status: string): string[] {
  if (role === 'worker') {
    if (status === 'offered') return ['accepted', 'cancelled'];
    return ['applied', 'shortlisted', 'interview'].includes(status) ? ['cancelled'] : [];
  }
  const transitions: Record<string, string[]> = {
    applied: ['shortlisted', 'interview', 'offered', 'rejected'],
    shortlisted: ['interview', 'offered', 'rejected'],
    interview: ['offered', 'rejected'],
    accepted: ['placed'],
    placed: ['completed'],
  };
  return transitions[status] || [];
}

export const ACTION_LABELS: Record<string, { en: string; ar: string }> = {
  shortlisted: { en: 'Shortlist', ar: 'إضافة للقائمة المختصرة' },
  interview: { en: 'Invite to interview', ar: 'دعوة للمقابلة' },
  offered: { en: 'Send offer', ar: 'إرسال عرض' },
  accepted: { en: 'Accept offer', ar: 'قبول العرض' },
  placed: { en: 'Confirm placement', ar: 'تأكيد التوظيف' },
  completed: { en: 'Mark completed', ar: 'تحديد كمكتمل' },
  rejected: { en: 'Reject', ar: 'رفض' },
  cancelled: { en: 'Withdraw application', ar: 'سحب الطلب' },
};

export const UAE_LOCATION_AR: Record<string,string> = { Dubai:'دبي', 'Abu Dhabi':'أبوظبي', Sharjah:'الشارقة', Ajman:'عجمان', 'Ras Al Khaimah':'رأس الخيمة', Fujairah:'الفجيرة', 'Umm Al Quwain':'أم القيوين' };
export const JOB_STATUS_LABELS: Record<string,{en:string;ar:string}> = { open:{en:'Open',ar:'مفتوحة'}, closed:{en:'Closed',ar:'مغلقة'}, draft:{en:'Draft',ar:'مسودة'}, in_progress:{en:'In progress',ar:'قيد التنفيذ'}, completed:{en:'Completed',ar:'مكتملة'}, cancelled:{en:'Cancelled',ar:'ملغاة'} };
export const UAE_LOCATIONS = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
export function cleanSearch(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().slice(0, 120);
}
export function uaeDate(value: string | null | undefined, arabic = false, withTime = true): string {
  if (!value || Number.isNaN(Date.parse(value))) return arabic ? 'لم يحدد' : 'Not specified';
  return new Intl.DateTimeFormat(arabic ? 'ar-AE' : 'en-AE', {
    dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' as const } : {}), timeZone: 'Asia/Dubai',
  }).format(new Date(value));
}
export function uaeInputToIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Enter a valid date and time');
  const date = new Date(`${value}:00+04:00`);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date and time');
  return date.toISOString();
}
export function formatJobPay(job: { pay_amount?: number | null; salary_min?: number | null; salary_max?: number | null; payment_model?: string | null; currency?: string | null }, arabic = false): string {
  const amount = job.salary_min ?? job.pay_amount;
  if (amount === null || amount === undefined) return arabic ? 'الراتب غير محدد' : 'Pay not specified';
  const number = (n: number) => n.toLocaleString(arabic ? 'ar-AE' : 'en-AE');
  const range = job.salary_max && job.salary_max > amount ? `${number(amount)}–${number(job.salary_max)}` : number(amount);
  const period = job.payment_model === 'hourly' ? (arabic ? '/ساعة' : '/hour') : job.payment_model === 'monthly' ? (arabic ? '/شهر' : '/month') : '';
  return `${range} ${job.currency || 'AED'}${period}`;
}
