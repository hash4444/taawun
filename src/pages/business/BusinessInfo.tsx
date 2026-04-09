import { useApp } from '@/contexts/AppContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Camera } from 'lucide-react';

export default function BusinessInfo() {
  const { isRTL } = useApp();

  const fields = [
    {
      label: isRTL ? 'الاسم التجاري' : 'Trade Name',
      value: isRTL ? 'مقهى الفنجان الذهبي' : 'Golden Cup Café',
    },
    {
      label: isRTL ? 'الاسم القانوني' : 'Legal Name',
      value: isRTL ? 'شركة الفنجان الذهبي للمشروبات' : 'Golden Cup Beverages Co.',
    },
    {
      label: isRTL ? 'القطاع' : 'Sector',
      value: isRTL ? 'مطاعم ومقاهي' : 'Restaurants & Cafes',
    },
    {
      label: isRTL ? 'العنوان' : 'Address',
      value: isRTL ? 'الرياض، حي العليا، شارع التحلية' : 'Riyadh, Al Olaya, Tahlia St.',
    },
    {
      label: isRTL ? 'اسم الممثل المفوض' : 'Authorized Rep. Name',
      value: isRTL ? 'محمد أحمد' : 'Mohammed Ahmed',
    },
    {
      label: isRTL ? 'منصب الممثل' : 'Rep. Role',
      value: isRTL ? 'المدير العام' : 'General Manager',
    },
  ];

  return (
    <MobileLayout
      header={
        <PageHeader 
          title={isRTL ? 'معلومات المنشأة' : 'Business Information'} 
          showBack 
          backPath="/business/profile" 
        />
      }
      noPadding
    >
      {/* Business Logo */}
      <div className="px-4 py-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl bg-primary-light flex items-center justify-center">
              <Building2 size={40} className="text-primary" />
            </div>
            <button className="absolute bottom-0 end-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Camera size={16} />
            </button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {isRTL ? 'اضغط لتغيير الشعار' : 'Tap to change logo'}
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-4 pb-6 space-y-4">
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

        <Button className="w-full h-12">
          {isRTL ? 'تعديل المعلومات' : 'Edit Information'}
        </Button>
      </div>
    </MobileLayout>
  );
}
