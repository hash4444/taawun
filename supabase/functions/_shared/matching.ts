import { assessAvailability, type AvailabilityPreferences, type BusyEvent } from './availability.ts';
type Row = Record<string, unknown>;
export interface MatchResult { score: number; eligible: boolean; explanation: string; strengths: string[]; gaps: string[] }
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
const norm = (value: string) => value.trim().toLocaleLowerCase();
export function matchStudent(student: Row, cv: Row | null, preferences: Row, job: Row, availability: AvailabilityPreferences | null, events: BusyEvent[], now = Date.now()): MatchResult {
  const strengths: string[] = []; const gaps: string[] = [];
  if (!student.adult_consent_at || !student.eligibility_confirmed || !String(student.work_eligibility ?? '').trim()) gaps.push('Complete the 18+ and work eligibility declarations');
  if (job.status !== 'open' || !job.end_time || Date.parse(String(job.end_time)) <= now || (job.deadline && Date.parse(String(job.deadline)) <= now)) gaps.push('The opportunity is closed or expired');
  if (Number(job.slots_filled ?? 0) >= Number(job.slots_total ?? 1)) gaps.push('All places have been filled');
  const skills = [...strings(student.skills), ...strings(cv?.skills)].map(norm);
  const required = strings(job.skills_required);
  const found = required.filter(skill => skills.includes(norm(skill)));
  const missing = required.filter(skill => !skills.includes(norm(skill)));
  if (missing.length) gaps.push(`Required skills not recorded: ${missing.join(', ')}`);
  if (found.length) strengths.push(`Recorded skills: ${found.join(', ')}`);
  if (Number(job.experience_years ?? 0) > experienceYears(cv?.experience, now)) gaps.push('Recorded experience does not meet the required years');
  const salaryMin = Number(preferences.salary_min ?? 0);
  const salaryCurrency = String(preferences.salary_currency ?? 'AED');
  if (salaryMin > 0 && job.payment_model !== 'monthly') gaps.push('Pay period needs manual review against your monthly pay preference');
  if (salaryMin > 0 && job.payment_model === 'monthly' && salaryCurrency === job.currency && Number(job.salary_max ?? job.salary_min ?? job.pay_amount ?? 0) < salaryMin) gaps.push('Advertised monthly pay does not meet the requested minimum');
  if (salaryMin > 0 && salaryCurrency !== job.currency) gaps.push('Pay currencies differ; review compensation manually');
  const locations = strings(preferences.locations);
  const locationFits = !!job.remote_allowed || !locations.length || locations.some(l => norm(String(job.location ?? '')).includes(norm(l)));
  if (!locationFits) gaps.push('Location is outside the requested areas');
  const excluded = strings(preferences.excluded_companies);
  if (excluded.some(c => norm(String(job.company_name ?? '')).includes(norm(c)))) gaps.push('Employer is excluded');
  const text = `${job.title ?? ''} ${job.description ?? ''}`.toLowerCase();
  if (strings(preferences.excluded_keywords).some(k => text.includes(norm(k)))) gaps.push('Opportunity contains an excluded keyword');
  if (job.schedule_kind === 'fixed') {
    const result = assessAvailability({ start_at: job.start_time as string | null, end_at: job.end_time as string | null }, availability, events);
    if (!result.compatible) gaps.push(...result.reasons); else strengths.push('Fits preferred hours and recorded academic commitments');
  } else strengths.push('Working hours require agreement with the employer');
  const preferredTypes = strings(preferences.job_types).length ? strings(preferences.job_types) : strings(student.preferred_job_types);
  const typeFits = !preferredTypes.length || preferredTypes.includes(String(job.job_type));
  if (typeFits) strengths.push('Matches the preferred opportunity type');
  const score = Math.round((required.length ? found.length / required.length : 1) * 60 + (typeFits ? 20 : 0) + (locationFits ? 20 : 0));
  return { score, eligible: gaps.length === 0, explanation: [...strengths, ...gaps].join('. '), strengths, gaps };
}
export function experienceYears(value: unknown, now: number): number {
  const intervals = (Array.isArray(value) ? value : []).map(item => {
    const e = item as { startDate?: string; endDate?: string; current?: boolean };
    return [Date.parse(e.startDate ?? ''), e.current ? now : Date.parse(e.endDate ?? '')];
  }).filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && start < end).sort((a, b) => a[0] - b[0]);
  let total = 0; let end = 0;
  for (const [start, finish] of intervals) { total += Math.max(0, Math.min(now, finish) - Math.max(start, end)); end = Math.max(end, finish); }
  return total / (365.25 * 86400000);
}
export function prepareCoverLetter(cv: Row | null, student: Row, job: Row) {
  const skills = [...new Set([...strings(student.skills), ...strings(cv?.skills)])].slice(0, 8);
  return `I am interested in the ${String(job.title ?? 'advertised')} opportunity. ${skills.length ? `My profile records these skills: ${skills.join(', ')}. ` : ''}${student.degree ? `My recorded education is ${String(student.degree)}${student.university ? ` at ${String(student.university)}` : ''}. ` : ''}Please review my profile and any attached CV. I would welcome a discussion about the role, working hours, and any required permits.\n\nPrepared from the student's recorded information for review.`;
}
