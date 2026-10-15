import { describe, expect, it } from 'vitest';
import { applicationActions, cleanSearch, formatJobPay, uaeInputToIso, uaeDate } from './marketplace';

describe('marketplace safety and UAE presentation', () => {
  it('never offers employer decisions or placement confirmation to students', () => {
    for (const status of ['applied','shortlisted','interview','offered','accepted','placed','completed','rejected']) {
      expect(applicationActions('worker',status).every(action=>['accepted','cancelled'].includes(action))).toBe(true);
    }
    expect(applicationActions('worker','offered')).toEqual(['accepted','cancelled']);
    expect(applicationActions('worker','accepted')).toEqual([]);
  });
  it('requires student acceptance before employer placement and preserves terminal states', () => {
    expect(applicationActions('business','offered')).toEqual([]);
    expect(applicationActions('business','accepted')).toEqual(['placed']);
    expect(applicationActions('business','applied')).not.toContain('accepted');
    expect(applicationActions('business','completed')).toEqual([]);
  });
  it('treats employer date input as UAE time independently of browser timezone', () => {
    expect(uaeInputToIso('2027-01-20T09:30')).toBe('2027-01-20T05:30:00.000Z');
    expect(()=>uaeInputToIso('2027-01-20')).toThrow();
    expect(uaeDate('2027-01-20T05:30:00Z')).toMatch(/9:30/);
  });
  it('keeps Arabic search and removes PostgREST expression delimiters', () => {
    expect(cleanSearch('تدريب، Dubai%(title.eq.any)')).toBe('تدريب  Dubai  title eq any');
    expect(cleanSearch('x'.repeat(200))).toHaveLength(120);
  });
  it('uses the stored currency without presenting a conversion', () => {
    expect(formatJobPay({pay_amount:45,currency:'AED',payment_model:'hourly'})).toBe('45 AED/hour');
    expect(formatJobPay({salary_min:2000,salary_max:3000,currency:'AED',payment_model:'monthly'})).toBe('2,000–3,000 AED/month');
    expect(formatJobPay({pay_amount:50,currency:'SAR'})).toBe('50 SAR');
  });
});
