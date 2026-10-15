import { describe, expect, it } from 'vitest';
import { accountHome, safeAuthRedirect, signupRole, trustedRole, verificationStatus } from './auth';
import { splitSkills, studentForm, validateStudentForm } from './student-profile';

describe('trusted account authorization', () => {
  it('accepts only canonical roles supplied by trusted role rows', () => {
    expect(trustedRole([{ role: 'WORKER' }, { role: 'SUPER_ADMIN' }])).toBeNull();
    expect(trustedRole([{ role: 'worker' }, { role: 'admin' }])).toBe('admin');
    expect(signupRole('admin')).toBe('worker');
    expect(signupRole('business')).toBe('business');
  });
  it('routes roles and incomplete students to the correct journey', () => {
    expect(accountHome({ role: 'business' })).toBe('/business/dashboard');
    expect(accountHome({ role: 'admin' })).toBe('/admin');
    expect(accountHome({ role: 'worker', needsOnboarding: true })).toBe('/worker/profile/setup');
    expect(accountHome({ role: 'worker', needsOnboarding: false })).toBe('/worker/home');
  });
  it('rejects external, audience-crossing and malformed callback redirects', () => {
    for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', '/business/dashboard', '/workerish/home', '/worker/../business/dashboard', '/worker/%2e%2e/business/dashboard']) expect(safeAuthRedirect(value, 'worker')).toBeNull();
    expect(safeAuthRedirect('/worker/applications?tab=interview', 'worker')).toBe('/worker/applications?tab=interview');
    expect(verificationStatus('verified')).toBe('verified');
    expect(verificationStatus('unexpected')).toBe('not_started');
  });
});

describe('student onboarding eligibility and consent', () => {
  const complete = () => ({ ...studentForm(), fullName: 'A Student', university: 'University', degree: 'Computer Science', graduationYear: '2027', academicStatus: 'undergraduate', city: 'Dubai', skills: 'Excel, Communication', jobTypes: ['part_time'], preferredHours: 'Weekends', eligibility: 'needs_confirmation', eligibilityConfirmed: true, adult: true });
  it('allows an accurate declaration needing permit confirmation without claiming verified eligibility', () => {
    expect(validateStudentForm(complete(), 2026)).toBeNull();
  });
  it('requires adult consent and an accurate eligibility declaration before completion', () => {
    expect(validateStudentForm({ ...complete(), adult: false }, 2026)).toContain('18');
    expect(validateStudentForm({ ...complete(), eligibilityConfirmed: false }, 2026)).toContain('eligibility');
  });
  it('rejects incomplete education, invalid years and missing work preferences', () => {
    expect(validateStudentForm({ ...complete(), degree: '' }, 2026)).toContain('university');
    expect(validateStudentForm({ ...complete(), graduationYear: '2049' }, 2026)).toContain('year');
    expect(validateStudentForm({ ...complete(), preferredHours: '' }, 2026)).toContain('hours');
  });
  it('prefills saved profile data and cleans duplicate skills without inventing details', () => {
    expect(studentForm({ id: 'u', firstName: '', lastName: '', full_name: 'Saved Student', city: 'Sharjah' }).fullName).toBe('Saved Student');
    expect(studentForm().university).toBe('');
    expect(splitSkills('Excel, Excel،Design,  ')).toEqual(['Excel', 'Design']);
  });
});
