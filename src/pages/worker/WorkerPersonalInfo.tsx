import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { WorkerDesktopShell } from '@/components/layout/WorkerDesktopShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Camera } from 'lucide-react';

export default function WorkerPersonalInfo() {
  const { isRTL } = useApp();
  const { profile, workerData } = useAuth();
  const isMobile = useIsMobile();

  const fields = [
    {
      label: isRTL ? 'الاسم الكامل' : 'Full Name',
      value: profile?.full_name || (isRTL ? 'أحمد محمد' : 'Ahmed Mohamed'),
    },
    {
      label: isRTL ? 'رقم الهاتف' : 'Phone Number',
      value: profile?.phone || '+966 50 123 4567',
    },
    {
      label: isRTL ? 'تاريخ الميلاد' : 'Date of Birth',
      value: (workerData?.dob as string | undefined) || '1995-06-15',
    },
    {
      label: isRTL ? 'المدينة' : 'City',
      value: (workerData?.city as string | undefined) || (isRTL ? 'الرياض' : 'Riyadh'),
    },
    {
      label: isRTL ? 'المنطقة' : 'Area',
      value: (workerData?.area as string | undefined) || (isRTL ? 'العليا' : 'Al Olaya'),
    },
  ];

  const photoBlock = (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center">
          <User size={40} className="text-primary" />
        </div>
        <button
          className="absolute bottom-0 end-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
          aria-label={isRTL ? 'تغيير الصورة' : 'Change photo'}
        >
          <Camera size={16} />
        </button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {isRTL ? 'اضغط لتغيير الصورة' : 'Tap to change photo'}
      </p>
    </div>
  );

  const formFields = (
    <div className="card-elevated p-4 space-y-4">
      {fields.map((field, index) => (
        <div key={index} className="space-y-2">
          <Label className="text-muted-foreground">{field.label}</Label>
          <Input
            value={field.value}
            readOnly
            className="bg-muted/50"
          />
        </div>
      ))}
    </div>
  );

  if (!isMobile) {
    return (
      <WorkerDesktopShell>
        <div className="max-w-2xl space-y-6">
          <h1 className="text-page-title text-foreground">
            {isRTL ? 'معلوماتي الشخصية' : 'Personal Information'}
          </h1>

          {photoBlock}
          {formFields}

          <Button className="h-12 px-8">
            {isRTL ? 'تعديل المعلومات' : 'Edit Information'}
          </Button>
        </div>
      </WorkerDesktopShell>
    );
  }

  return (
    <MobileLayout
      header={
        <PageHeader
          title={isRTL ? 'معلوماتي الشخصية' : 'Personal Information'}
          showBack
          backPath="/worker/profile"
        />
      }
      noPadding
    >
      {/* Profile Photo */}
      <div className="px-4 py-6">
        {photoBlock}
      </div>

      {/* Form Fields */}
      <div className="px-4 pb-6 space-y-4">
        {formFields}

        <Button className="w-full h-12">
          {isRTL ? 'تعديل المعلومات' : 'Edit Information'}
        </Button>
      </div>
    </MobileLayout>
  );
}
