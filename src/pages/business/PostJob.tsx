import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateJob, JOB_TYPE_LABELS, PAYMENT_MODEL_LABELS } from '@/hooks/useJobs';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  MapPin, 
  Banknote, 
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type JobType = 'shift' | 'full_time' | 'part_time' | 'freelance' | 'digital_service';
type PaymentModel = 'hourly' | 'fixed' | 'monthly' | 'milestone';

export default function PostJob() {
  const { t, isRTL } = useApp();
  const { user, businessData, isVerified } = useAuth();
  const navigate = useNavigate();
  const createJobMutation = useCreateJob();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    jobType: 'shift' as JobType,
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    paymentModel: 'hourly' as PaymentModel,
    payAmount: '',
    salaryMin: '',
    salaryMax: '',
    workersNeeded: '1',
    requirements: '',
    remoteAllowed: false,
  });

  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;
  const BackArrow = isRTL ? ChevronRight : ChevronLeft;

  const jobTypes: { key: JobType; icon: string }[] = [
    { key: 'shift', icon: '⏰' },
    { key: 'full_time', icon: '💼' },
    { key: 'part_time', icon: '🕐' },
    { key: 'freelance', icon: '💻' },
    { key: 'digital_service', icon: '🌐' },
  ];

  const validateStep1 = () => {
    if (!formData.title.trim()) {
      toast.error(isRTL ? 'يرجى إدخال عنوان الوظيفة' : 'Please enter a job title');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.jobType === 'shift') {
      if (!formData.date) {
        toast.error(isRTL ? 'يرجى اختيار التاريخ' : 'Please select a date');
        return false;
      }
      if (!formData.startTime || !formData.endTime) {
        toast.error(isRTL ? 'يرجى تحديد أوقات البداية والنهاية' : 'Please set start and end times');
        return false;
      }
    }
    if (!formData.location.trim() && !formData.remoteAllowed) {
      toast.error(isRTL ? 'يرجى إدخال الموقع أو تحديد العمل عن بعد' : 'Please enter a location or mark as remote');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.paymentModel === 'monthly') {
      if (!formData.salaryMin || parseFloat(formData.salaryMin) <= 0) {
        toast.error(isRTL ? 'يرجى إدخال الحد الأدنى للراتب' : 'Please enter minimum salary');
        return false;
      }
    } else {
      if (!formData.payAmount || parseFloat(formData.payAmount) <= 0) {
        toast.error(isRTL ? 'يرجى إدخال مبلغ صالح' : 'Please enter a valid pay amount');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    if (!user) {
      toast.error(isRTL ? 'يجب تسجيل الدخول' : 'You must be logged in');
      return;
    }

    if (!isVerified) {
      toast.error(
        isRTL ? 'يجب التحقق من حسابك أولاً' : 'Your account must be verified first',
        { description: isRTL ? 'يرجى إكمال عملية التحقق' : 'Please complete verification' }
      );
      navigate('/business/verification');
      return;
    }

    try {
      // Build job data
      let startDateTime: Date | undefined;
      let endDateTime: Date | undefined;

      if (formData.jobType === 'shift' && formData.date && formData.startTime && formData.endTime) {
        startDateTime = new Date(`${formData.date}T${formData.startTime}`);
        endDateTime = new Date(`${formData.date}T${formData.endTime}`);
        if (endDateTime <= startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }
      } else {
        // For non-shift jobs, use current date as placeholder
        startDateTime = new Date();
        endDateTime = new Date();
        endDateTime.setDate(endDateTime.getDate() + 30); // 30 days from now
      }

      await createJobMutation.mutateAsync({
        title: formData.title.trim(),
        job_type: formData.jobType,
        payment_model: formData.paymentModel,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        address: formData.remoteAllowed ? 'Remote' : formData.location.trim(),
        pay_amount: formData.paymentModel === 'monthly' 
          ? parseFloat(formData.salaryMin) 
          : parseFloat(formData.payAmount),
        salary_min: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        salary_max: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        slots_total: parseInt(formData.workersNeeded),
        description: formData.requirements.trim() || null,
        sector: businessData?.sector || null,
        status: 'open',
        currency: 'SAR',
        remote_allowed: formData.remoteAllowed,
        service_direction: 'business_offers',
      });

      toast.success(
        isRTL ? 'تم نشر الوظيفة بنجاح!' : 'Job posted successfully!',
        { description: isRTL ? 'يمكن للعمال الآن التقديم' : 'Workers can now apply' }
      );
      
      navigate('/business/dashboard');
    } catch (err: any) {
      console.error('Error creating job:', err);
      toast.error(isRTL ? 'فشل إنشاء الوظيفة' : 'Failed to create job', { description: err.message });
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Job Type Selection */}
            <div className="space-y-3">
              <Label>{isRTL ? 'نوع الوظيفة' : 'Job Type'}</Label>
              <div className="grid grid-cols-2 gap-3">
                {jobTypes.map(({ key, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateField('jobType', key)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all text-start',
                      formData.jobType === key
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-2xl mb-2 block">{icon}</span>
                    <span className="font-medium text-sm">
                      {JOB_TYPE_LABELS[key]?.[isRTL ? 'ar' : 'en'] || key}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                {isRTL ? 'عنوان الوظيفة' : 'Job Title'}
              </Label>
              <div className="relative">
                <Briefcase className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={isRTL ? 'مثال: مطور ويب، مصمم جرافيك' : 'e.g., Web Developer, Graphic Designer'}
                  className="ps-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workers">
                {isRTL ? 'عدد المطلوبين' : 'Positions Available'}
              </Label>
              <div className="relative">
                <Users className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="workers"
                  type="number"
                  min="1"
                  value={formData.workersNeeded}
                  onChange={(e) => updateField('workersNeeded', e.target.value)}
                  className="ps-10 h-12"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Date/Time for Shifts */}
            {formData.jobType === 'shift' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="date">{t('date')}</Label>
                  <div className="relative">
                    <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateField('date', e.target.value)}
                      className="ps-10 h-12"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">{isRTL ? 'وقت البداية' : 'Start Time'}</Label>
                    <div className="relative">
                      <Clock className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => updateField('startTime', e.target.value)}
                        className="ps-10 h-12"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">{isRTL ? 'وقت النهاية' : 'End Time'}</Label>
                    <div className="relative">
                      <Clock className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => updateField('endTime', e.target.value)}
                        className="ps-10 h-12"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Remote Option */}
            {(formData.jobType === 'freelance' || formData.jobType === 'digital_service' || formData.jobType === 'full_time' || formData.jobType === 'part_time') && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
                <input
                  type="checkbox"
                  id="remote"
                  checked={formData.remoteAllowed}
                  onChange={(e) => updateField('remoteAllowed', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="remote" className="font-medium">
                  {isRTL ? 'يمكن العمل عن بعد' : 'Remote work allowed'}
                </label>
              </div>
            )}

            {!formData.remoteAllowed && (
              <div className="space-y-2">
                <Label htmlFor="location">{t('location')}</Label>
                <div className="relative">
                  <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder={isRTL ? 'أدخل عنوان موقع العمل' : 'Enter work location address'}
                    className="ps-10 h-12"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Payment Model */}
            <div className="space-y-2">
              <Label>{isRTL ? 'نموذج الدفع' : 'Payment Model'}</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['hourly', 'fixed', 'monthly', 'milestone'] as PaymentModel[]).map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => updateField('paymentModel', model)}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all text-center',
                      formData.paymentModel === model
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="font-medium text-sm">
                      {PAYMENT_MODEL_LABELS[model]?.[isRTL ? 'ar' : 'en'] || model}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pay Amount */}
            {formData.paymentModel === 'monthly' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">{isRTL ? 'الحد الأدنى (ر.س)' : 'Min Salary (SAR)'}</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    min="0"
                    value={formData.salaryMin}
                    onChange={(e) => updateField('salaryMin', e.target.value)}
                    placeholder="5000"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">{isRTL ? 'الحد الأقصى (ر.س)' : 'Max Salary (SAR)'}</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    min="0"
                    value={formData.salaryMax}
                    onChange={(e) => updateField('salaryMax', e.target.value)}
                    placeholder="8000"
                    className="h-12"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="payAmount">
                  {isRTL ? 'المبلغ (ر.س)' : 'Amount (SAR)'}
                </Label>
                <div className="relative">
                  <Banknote className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="payAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.payAmount}
                    onChange={(e) => updateField('payAmount', e.target.value)}
                    placeholder={formData.paymentModel === 'hourly' ? '45' : '350'}
                    className="ps-10 h-12"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="requirements">{t('requirements')}</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => updateField('requirements', e.target.value)}
                placeholder={isRTL ? 'أي متطلبات أو مهارات مطلوبة...' : 'Any requirements or skills needed...'}
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MobileLayout
      header={
        <PageHeader
          title={isRTL ? 'نشر وظيفة' : 'Post a Job'}
          showBack
          subtitle={`${isRTL ? 'الخطوة' : 'Step'} ${step} ${isRTL ? 'من' : 'of'} 3`}
        />
      }
      noPadding
    >
      <div className="px-4 py-4 flex-1">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="px-4 pb-6 pb-safe flex gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex-1 h-14"
            size="lg"
          >
            <BackArrow size={18} className="me-1" />
            {t('back')}
          </Button>
        )}
        
        {step < 3 ? (
          <Button
            onClick={handleNextStep}
            className="flex-1 h-14"
            size="lg"
          >
            {t('next')}
            <ArrowIcon size={18} className="ms-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createJobMutation.isPending}
            className="flex-1 h-14"
            size="lg"
          >
            {createJobMutation.isPending ? t('loading') : t('submit')}
          </Button>
        )}
      </div>
    </MobileLayout>
  );
}
