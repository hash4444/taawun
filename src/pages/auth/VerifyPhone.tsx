import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';

export default function VerifyPhone() {
  const navigate = useNavigate();
  const { t, isRTL } = useApp();
  const { profile } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate sending OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStep('otp');
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    
    setLoading(true);
    
    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(false);
    
    // Navigate to appropriate dashboard
    if (profile?.role === 'business') {
      navigate('/business/dashboard');
    } else {
      navigate('/worker/home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-safe">
        <button
          onClick={() => step === 'otp' ? setStep('phone') : navigate(-1)}
          className="flex items-center gap-1 py-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackIcon size={20} />
          <span>{t('back')}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t('verifyPhone')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {step === 'phone'
            ? isRTL ? 'سنرسل لك رمز تحقق' : "We'll send you a verification code"
            : `${t('otpSent')} ${phone}`
          }
        </p>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isRTL ? '+966 5X XXX XXXX' : '+966 5X XXX XXXX'}
                  className="ps-10 h-12"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !phone}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {loading ? t('loading') : t('next')}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>{t('enterOtp')}</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {loading ? t('loading') : t('submit')}
            </Button>

            <button
              type="button"
              className="w-full text-center text-primary hover:underline"
              onClick={() => {
                // Resend OTP logic
              }}
            >
              {isRTL ? 'إعادة إرسال الرمز' : 'Resend code'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
