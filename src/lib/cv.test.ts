import { describe, expect, it } from 'vitest';
import { cvPDFSlices, draftCVSummary, privateCVPath } from './cv';

describe('private CV storage keys', () => {
  it('accepts owner-bound private paths and same-project legacy public URLs', () => {
    expect(privateCVPath('owner-id/file.pdf', 'owner-id')).toBe('owner-id/file.pdf');
    expect(privateCVPath('https://project.supabase.co/storage/v1/object/public/cv_files/owner-id/file.docx', 'owner-id', 'https://project.supabase.co')).toBe('owner-id/file.docx');
  });
  it('rejects another owner, arbitrary origins, traversal and unexpected file formats', () => {
    for (const value of ['other-id/file.pdf', 'owner-id/../file.pdf', 'owner-id/%2e%2e.pdf', 'owner-id/sub/file.pdf', 'owner-id/file.html', 'https://evil.example/storage/v1/object/public/cv_files/owner-id/file.pdf', 'owner-id/file.pdf?token=secret']) expect(() => privateCVPath(value, 'owner-id', 'https://project.supabase.co')).toThrow();
  });
});

describe('factual local CV summary', () => {
  it('uses only entered education, experience and skills without inventing qualifications', () => {
    const draft = draftCVSummary({ education: [{ institution: 'Example University', degree: '', field: 'Engineering', startYear: '', endYear: '2027' }], experience: [], skills: ['Excel', 'Communication'] });
    expect(draft).toBe('Education: Engineering · Example University.\nSkills: Excel, Communication.');
    expect(draft).not.toMatch(/graduate|expert|years|eligible|bachelor|professional/i);
  });
  it('does not infer experience from empty fields and supports an Arabic template', () => {
    expect(draftCVSummary({ education: [], experience: [], skills: [] })).toBe('');
    expect(draftCVSummary({ education: [], experience: [{ title: 'متدرب', company: 'شركة', startDate: '', endDate: '', description: '', current: false }], skills: ['Excel'] }, 'ar')).toBe('الخبرة: متدرب · شركة.\nالمهارات: Excel.');
  });
});

describe('CV PDF pagination', () => {
  it('covers every source pixel exactly once within A4 margins, including a partial last page', () => {
    const pages = cvPDFSlices(1600, 7000);
    expect(pages.length).toBeGreaterThan(1);
    let y = 0;
    for (const page of pages) {
      expect(page.sourceY).toBe(y); expect(page.sourceHeight).toBeGreaterThan(0);
      expect(page.heightMm).toBeLessThanOrEqual(277); expect(page.widthMm).toBe(190);
      y += page.sourceHeight;
    }
    expect(y).toBe(7000); expect(pages[pages.length - 1].heightMm).toBeLessThan(277);
  });
  it('does not create an extra blank page on an exact boundary and rejects invalid sizes', () => {
    expect(cvPDFSlices(1900, 5540)).toHaveLength(2);
    expect(() => cvPDFSlices(0, 100)).toThrow();
  });
});
