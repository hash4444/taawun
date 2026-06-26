import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Mail, Phone, MessageCircle } from 'lucide-react';

export default function HelpSupport() {
  const { isRTL } = useApp();
  const { profile } = useAuth();

  const backPath = profile?.role === 'business' ? '/business/profile' : '/worker/profile';

  const faqs = [
    {
      question: isRTL ? 'كيف أتقدم للوردية؟' : 'How do I apply for a shift?',
      answer: isRTL 
        ? 'اذهب إلى الصفحة الرئيسية، تصفح الورديات المتاحة، واضغط على "تقديم" على أي وردية تناسبك.'
        : 'Go to the home page, browse available shifts, and tap "Apply" on any shift that suits you.',
    },
    {
      question: isRTL ? 'متى أحصل على أرباحي؟' : 'When do I get paid?',
      answer: isRTL
        ? 'يتم تحويل الأرباح خلال 3-5 أيام عمل بعد إكمال الوردية وموافقة صاحب العمل.'
        : 'Earnings are transferred within 3-5 business days after completing the shift and employer approval.',
    },
    {
      question: isRTL ? 'كيف أتحقق من حسابي؟' : 'How do I verify my account?',
      answer: isRTL
        ? 'اذهب إلى الملف الشخصي > التحقق، وقم برفع المستندات المطلوبة (الهوية + صورة شخصية).'
        : 'Go to Profile > Verification and upload the required documents (ID + selfie).',
    },
    {
      question: isRTL ? 'ماذا لو واجهت مشكلة في الوردية؟' : 'What if I have an issue with a shift?',
      answer: isRTL
        ? 'يمكنك فتح نزاع من صفحة تفاصيل الوردية أو التواصل معنا مباشرة عبر الدعم.'
        : 'You can open a dispute from the shift details page or contact us directly through support.',
    },
  ];

  const contactOptions = [
    {
      icon: Mail,
      label: isRTL ? 'البريد الإلكتروني' : 'Email',
      value: 'support@taawun.app',
      action: () => window.open('mailto:support@taawun.app'),
    },
    {
      icon: Phone,
      label: isRTL ? 'الهاتف' : 'Phone',
      value: '+966 11 234 5678',
      action: () => window.open('tel:+966112345678'),
    },
    {
      icon: MessageCircle,
      label: isRTL ? 'المحادثة المباشرة' : 'Live Chat',
      value: isRTL ? 'متاح 24/7' : 'Available 24/7',
      action: () => {},
    },
  ];

  return (
    <MobileLayout
      header={
        <PageHeader 
          title={isRTL ? 'المساعدة والدعم' : 'Help & Support'} 
          showBack 
          backPath={backPath} 
        />
      }
      noPadding
    >
      {/* FAQ Section */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold mb-3">
          {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h2>
        <div className="card-elevated">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="px-4">
                <AccordionTrigger className="text-start hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Contact Options */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-semibold mb-3">
          {isRTL ? 'تواصل معنا' : 'Contact Us'}
        </h2>
        <div className="space-y-3">
          {contactOptions.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={option.action}
              className="w-full h-auto py-4 justify-start"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center me-3">
                <option.icon size={20} className="text-primary" />
              </div>
              <div className="text-start">
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.value}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
