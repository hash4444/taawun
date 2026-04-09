import { useApp } from '@/contexts/AppContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNav } from '@/components/layout/BottomNav';
import {
  BarChart3, MapPin, DollarSign, Clock, Users, TrendingUp, Brain,
  ArrowUpRight, Target, Building2, Sparkles, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const TALENT_BY_LOCATION = [
  { city: 'Riyadh', available: 12400, bar: 95 },
  { city: 'Jeddah', available: 8200, bar: 68 },
  { city: 'Dammam', available: 4100, bar: 42 },
  { city: 'Mecca', available: 2800, bar: 30 },
  { city: 'Medina', available: 1900, bar: 22 },
];

const SALARY_BENCHMARKS = [
  { role: 'Software Engineer', p25: '12K', p50: '18K', p75: '26K' },
  { role: 'Marketing Manager', p25: '10K', p50: '15K', p75: '22K' },
  { role: 'Accountant', p25: '8K', p50: '12K', p75: '17K' },
  { role: 'Sales Executive', p25: '7K', p50: '11K', p75: '16K' },
];

const DEMAND_BY_ROLE = [
  { role: 'Developers', demand: 92, trend: '+18%' },
  { role: 'Sales', demand: 78, trend: '+8%' },
  { role: 'Operations', demand: 71, trend: '+5%' },
  { role: 'Marketing', demand: 65, trend: '+12%' },
  { role: 'Finance', demand: 58, trend: '+3%' },
];

const TIME_TO_FILL = [
  { category: 'Tech Roles', days: 34, color: 'bg-destructive/70' },
  { category: 'Sales', days: 21, color: 'bg-warning' },
  { category: 'Operations', days: 16, color: 'bg-success' },
  { category: 'Admin', days: 12, color: 'bg-primary' },
];

const SUPPLY_TRENDS = [
  { month: 'Sep', supply: 60 },
  { month: 'Oct', supply: 65 },
  { month: 'Nov', supply: 72 },
  { month: 'Dec', supply: 58 },
  { month: 'Jan', supply: 80 },
  { month: 'Feb', supply: 88 },
];

export default function BusinessCareerIntelligence() {
  const { isRTL } = useApp();
  const navigate = useNavigate();

  return (
    <MobileLayout footer={<BottomNav />} noPadding>
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/8 to-transparent px-4 pt-safe pb-2">
        <div className="flex items-center justify-between pt-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 size={22} className="text-primary" />
              {isRTL ? 'ذكاء التوظيف' : 'Hiring Intelligence'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL ? 'رؤى القوى العاملة المدعومة بالذكاء الاصطناعي' : 'AI-powered workforce insights'}
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
            Live
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 pb-6">

        {/* AI Hiring Recommendations */}
        <section className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-4 text-primary-foreground">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} />
            <h2 className="font-bold text-sm">{isRTL ? 'توصيات الذكاء الاصطناعي' : 'AI Hiring Recommendations'}</h2>
            <Sparkles size={14} className="opacity-70" />
          </div>
          <p className="text-xs opacity-90 leading-relaxed mb-3">
            {isRTL
              ? 'بناءً على بيانات السوق الحالية، نوصي بنشر وظائف التقنية يوم الأحد للحصول على أعلى نسبة استجابة. الطلب على المطورين في ذروته.'
              : 'Based on current market data, post tech roles on Sundays for 40% higher response rates. Developer demand is peaking — consider competitive salary packages.'}
          </p>
          <button
            onClick={() => navigate('/business/assistant')}
            className="flex items-center gap-1.5 text-xs font-semibold opacity-90 hover:opacity-100 transition-opacity"
          >
            {isRTL ? 'تحدث مع مساعد التوظيف' : 'Talk to Hiring Assistant'}
            <ArrowUpRight size={14} />
          </button>
        </section>

        {/* Talent Availability by Location */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">{isRTL ? 'الكفاءات حسب الموقع' : 'Talent by Location'}</h2>
          </div>
          <div className="space-y-2.5">
            {TALENT_BY_LOCATION.map((loc) => (
              <div key={loc.city} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{loc.city}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark"
                    style={{ width: `${loc.bar}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-foreground flex-shrink-0 w-14 text-end">
                  {loc.available.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Salary Benchmarks */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-warning" />
            <h2 className="font-semibold text-sm text-foreground">{isRTL ? 'معايير الرواتب' : 'Salary Benchmarks'}</h2>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 bg-muted/50 border-b border-border">
              <span className="col-span-1">{isRTL ? 'الدور' : 'Role'}</span>
              <span className="text-center">P25</span>
              <span className="text-center">P50</span>
              <span className="text-center">P75</span>
            </div>
            {SALARY_BENCHMARKS.map((s) => (
              <div key={s.role} className="grid grid-cols-4 text-xs px-3 py-2.5 border-b border-border last:border-0">
                <span className="font-medium text-foreground truncate">{s.role}</span>
                <span className="text-center text-muted-foreground">{s.p25}</span>
                <span className="text-center font-semibold text-primary">{s.p50}</span>
                <span className="text-center text-muted-foreground">{s.p75}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-end">SAR/month</p>
        </section>

        {/* Time-to-Fill & Competition */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Time-to-Fill */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={14} className="text-info" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {isRTL ? 'وقت الملء' : 'Time-to-Fill'}
              </span>
            </div>
            <div className="space-y-2">
              {TIME_TO_FILL.map((t) => (
                <div key={t.category} className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', t.color)} />
                  <span className="text-[11px] text-foreground flex-1 truncate">{t.category}</span>
                  <span className="text-[11px] font-bold text-foreground">{t.days}d</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hiring Competition */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={14} className="text-warning" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {isRTL ? 'المنافسة' : 'Competition'}
              </span>
            </div>
            <div className="space-y-1.5 mt-1">
              <div>
                <p className="text-xl font-bold text-foreground">3.2x</p>
                <p className="text-[10px] text-muted-foreground">{isRTL ? 'متوسط المنافسة' : 'Avg. competition ratio'}</p>
              </div>
              <div className="pt-1 border-t border-border">
                <p className="text-sm font-bold text-success">↓ 12%</p>
                <p className="text-[10px] text-muted-foreground">{isRTL ? 'مقارنة بالشهر الماضي' : 'vs. last month'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Demand by Role */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">{isRTL ? 'الطلب حسب الدور' : 'Market Demand by Role'}</h2>
          </div>
          <div className="space-y-2.5">
            {DEMAND_BY_ROLE.map((d) => (
              <div key={d.role} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{d.role}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${d.demand}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-success flex-shrink-0">{d.trend}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Workforce Supply Trends — Mini Chart */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-success" />
            <h2 className="font-semibold text-sm text-foreground">{isRTL ? 'اتجاهات العرض' : 'Workforce Supply Trends'}</h2>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-end justify-between h-24 gap-2">
              {SUPPLY_TRENDS.map((s) => (
                <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary/60 to-primary transition-all duration-500"
                    style={{ height: `${s.supply}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{s.month}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {isRTL ? 'المتقدمون النشطون (آلاف)' : 'Active applicants (thousands)'}
            </p>
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
