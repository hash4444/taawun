import type { CVEducation, CVExperience } from '@/hooks/useCV';

/** Accept only an owner's private object key or a legacy URL from this Supabase origin. */
export function privateCVPath(stored: string, ownerId: string, storageOrigin = import.meta.env.VITE_SUPABASE_URL || ''): string {
  let path = stored;
  if (/^https?:/i.test(stored)) {
    let url: URL, allowed: URL;
    try { url = new URL(stored); allowed = new URL(storageOrigin); } catch { throw new Error('This CV file reference is not supported.'); }
    if (url.origin !== allowed.origin) throw new Error('This CV file does not belong to this storage service.');
    const prefix = '/storage/v1/object/public/cv_files/';
    if (!url.pathname.startsWith(prefix)) throw new Error('This CV file reference is not supported.');
    try { path = decodeURIComponent(url.pathname.slice(prefix.length)); } catch { throw new Error('Invalid CV file path.'); }
  }
  const parts = path.split('/');
  if (!ownerId || parts.length !== 2 || parts[0] !== ownerId || !/^[A-Za-z0-9._-]+\.(pdf|doc|docx)$/i.test(parts[1]) || parts[1].includes('..') || (path.includes('\\') || /[%?#]/.test(path) || [...path].some(char => char.charCodeAt(0) < 32))) throw new Error('The CV file path is invalid or belongs to another account.');
  return path;
}

/** A factual local template. It adds no experience, proficiency, graduation or eligibility claims. */
export function draftCVSummary(input: { education: CVEducation[]; experience: CVExperience[]; skills: string[] }, language: 'en' | 'ar' = 'en'): string {
  const education = input.education.map(item => [item.degree.trim(), item.field.trim(), item.institution.trim()].filter(Boolean).join(' · ')).filter(Boolean).slice(0, 3);
  const experience = input.experience.map(item => [item.title.trim(), item.company.trim()].filter(Boolean).join(' · ')).filter(Boolean).slice(0, 3);
  const skills = [...new Set(input.skills.map(skill => skill.trim()).filter(Boolean))].slice(0, 12);
  return [
    education.length ? `${language === 'ar' ? 'التعليم' : 'Education'}: ${education.join('; ')}.` : '',
    experience.length ? `${language === 'ar' ? 'الخبرة' : 'Experience'}: ${experience.join('; ')}.` : '',
    skills.length ? `${language === 'ar' ? 'المهارات' : 'Skills'}: ${skills.join(', ')}.` : '',
  ].filter(Boolean).join('\n');
}
export interface PDFSlice { sourceY: number; sourceHeight: number; widthMm: number; heightMm: number }
export function cvPDFSlices(canvasWidth: number, canvasHeight: number, pageWidthMm = 210, pageHeightMm = 297, marginMm = 10): PDFSlice[] {
  if (![canvasWidth, canvasHeight, pageWidthMm, pageHeightMm, marginMm].every(Number.isFinite) || canvasWidth <= 0 || canvasHeight <= 0 || marginMm < 0 || pageWidthMm <= marginMm * 2 || pageHeightMm <= marginMm * 2) throw new Error('Invalid PDF page dimensions.');
  const widthMm = pageWidthMm - marginMm * 2;
  const pagePixels = Math.max(1, Math.floor((pageHeightMm - marginMm * 2) * canvasWidth / widthMm));
  const pages: PDFSlice[] = [];
  for (let sourceY = 0; sourceY < canvasHeight; sourceY += pagePixels) {
    const sourceHeight = Math.min(pagePixels, canvasHeight - sourceY);
    pages.push({ sourceY, sourceHeight, widthMm, heightMm: sourceHeight * widthMm / canvasWidth });
  }
  return pages;
}
