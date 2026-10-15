import type { StudentProfile, Profile } from '@/contexts/auth-context-base';

export interface StudentForm {
  fullName: string; phone: string; university: string; degree: string; graduationYear: string;
  academicStatus: string; city: string; skills: string; jobTypes: string[]; preferredHours: string;
  eligibility: string; eligibilityConfirmed: boolean; adult: boolean; matchingConsent: boolean;
}
export const STUDENT_JOB_TYPES = [
  { key: 'part_time', en: 'Part-time', ar: 'دوام جزئي' },
  { key: 'internship', en: 'Internship', ar: 'تدريب' },
  { key: 'full_time', en: 'Graduate / full-time', ar: 'للخريجين / دوام كامل' },
  { key: 'shift', en: 'Temporary / shifts', ar: 'مؤقت / ورديات' },
  { key: 'freelance', en: 'Project-based', ar: 'مشاريع' },
];
export function studentForm(profile?: Profile, student?: StudentProfile | null): StudentForm {
  return {
    fullName: profile?.full_name || '', phone: profile?.phone || '', university: student?.university || '',
    degree: student?.degree || '', graduationYear: student?.graduation_year?.toString() || '',
    academicStatus: student?.academic_status || '', city: student?.city || profile?.city || '',
    skills: student?.skills?.join(', ') || '', jobTypes: student?.preferred_job_types || [],
    preferredHours: student?.preferred_hours || '', eligibility: student?.work_eligibility || '',
    eligibilityConfirmed: student?.eligibility_confirmed || false, adult: !!student?.adult_consent_at,
    matchingConsent: student?.consent_to_matching || false,
  };
}
export function splitSkills(value: string): string[] {
  return [...new Set(value.split(/[,،]/).map(skill => skill.trim()).filter(Boolean))].slice(0, 30);
}
export function validateStudentForm(form: StudentForm, currentYear = new Date().getFullYear()): string | null {
  if (!form.fullName.trim()) return 'Enter your full name.';
  if (!form.university.trim() || !form.degree.trim() || !form.academicStatus) return 'Add your university, degree and academic status.';
  const year = Number(form.graduationYear);
  if (!Number.isInteger(year) || year < 1950 || year > currentYear + 15) return 'Enter a valid graduation year.';
  if (!form.city || !splitSkills(form.skills).length || !form.jobTypes.length || !form.preferredHours.trim()) return 'Add your location, skills, job types and preferred hours.';
  if (!form.eligibility || !form.eligibilityConfirmed) return 'Declare your work eligibility information.';
  if (!form.adult) return 'TAAWUN currently supports students and graduates aged 18 and above.';
  return null;
}
