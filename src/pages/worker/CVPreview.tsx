import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useCVRecords, CVRecord } from '@/hooks/useCV';
import { Download, Mail, Phone, MapPin, Linkedin, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function CVPreview() {
  const { id } = useParams<{ id: string }>();
  const { isRTL } = useApp();
  const navigate = useNavigate();
  const cvRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const { data: cvs } = useCVRecords();
  const cv = cvs?.find(c => c.id === id);

  const handleDownload = async () => {
    if (!cvRef.current || !cv) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${cv.personal_info?.fullName || 'CV'}.pdf`);
      toast({ title: isRTL ? 'تم التحميل' : 'PDF Downloaded!' });
    } catch {
      toast({ title: isRTL ? 'خطأ' : 'Error', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  if (!cv) {
    return (
      <MobileLayout header={<PageHeader title="CV" showBack />}>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{isRTL ? 'السيرة غير موجودة' : 'CV not found'}</p>
        </div>
      </MobileLayout>
    );
  }

  const p = cv.personal_info || {};

  return (
    <MobileLayout
      header={
        <PageHeader
          title={isRTL ? 'معاينة السيرة الذاتية' : 'CV Preview'}
          showBack
          action={
            <Button size="sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="me-1" />}
              PDF
            </Button>
          }
        />
      }
      noPadding
    >
      <div className="p-4 overflow-y-auto pb-8">
        {/* CV Content */}
        <div ref={cvRef} className="bg-white p-8 rounded-xl shadow-sm max-w-[210mm] mx-auto" style={{ fontFamily: 'Inter, sans-serif', color: '#1a1a2e' }}>
          {/* Header */}
          <div style={{ borderBottom: '3px solid hsl(168, 84%, 32%)', paddingBottom: '16px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{p.fullName || 'Your Name'}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
              {p.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✉ {p.email}
                </span>
              )}
              {p.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ☎ {p.phone}
                </span>
              )}
              {(p.city || p.country) && (
                <span>📍 {[p.city, p.country].filter(Boolean).join(', ')}</span>
              )}
              {p.linkedIn && (
                <span>🔗 LinkedIn</span>
              )}
            </div>
          </div>

          {/* Summary */}
          {cv.summary && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'hsl(168, 84%, 32%)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Professional Summary
              </h2>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>{cv.summary}</p>
            </div>
          )}

          {/* Experience */}
          {cv.experience?.length > 0 && cv.experience.some(e => e.title || e.company) && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'hsl(168, 84%, 32%)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Experience
              </h2>
              {cv.experience.filter(e => e.title || e.company).map((exp, i) => (
                <div key={i} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>{exp.title}</h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0' }}>{exp.company}</p>
                  {exp.description && (
                    <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#374151', marginTop: '4px' }}>{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {cv.education?.length > 0 && cv.education.some(e => e.institution) && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'hsl(168, 84%, 32%)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Education
              </h2>
              {cv.education.filter(e => e.institution).map((edu, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {edu.startYear} — {edu.endYear}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0' }}>{edu.institution}</p>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {cv.skills?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'hsl(168, 84%, 32%)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Skills
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cv.skills.map((skill, i) => (
                  <span key={i} style={{ padding: '4px 12px', background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '20px', fontSize: '13px', color: '#0d9488' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {cv.languages?.length > 0 && cv.languages.some(l => l.name) && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'hsl(168, 84%, 32%)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Languages
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {cv.languages.filter(l => l.name).map((lang, i) => (
                  <span key={i} style={{ fontSize: '13px' }}>
                    <strong>{lang.name}</strong> — {lang.level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
