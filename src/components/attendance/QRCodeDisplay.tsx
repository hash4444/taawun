import { useEffect, useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { generateQRData } from '@/hooks/useAttendance';
import { QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  jobId: string;
  businessId: string;
  action: 'check_in' | 'check_out';
}

export function QRCodeDisplay({ jobId, businessId, action }: QRCodeDisplayProps) {
  const { isRTL } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      const qrData = generateQRData(jobId, businessId, action);
      // Using a simple QR code generator API
      const encodedData = encodeURIComponent(qrData);
      setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`);
    };
    
    generateQR();
    
    // Refresh QR code every 30 seconds for security
    const interval = setInterval(generateQR, 30000);
    return () => clearInterval(interval);
  }, [jobId, businessId, action]);

  return (
    <div className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border">
      <div className="mb-4 text-center">
        <h3 className="font-semibold text-card-title text-foreground">
          {action === 'check_in'
            ? (isRTL ? 'رمز تسجيل الحضور' : 'Check-in QR Code')
            : (isRTL ? 'رمز تسجيل الخروج' : 'Check-out QR Code')}
        </h3>
        <p className="text-body text-muted-foreground mt-1">
          {isRTL
            ? 'اطلب من العامل مسح هذا الرمز'
            : 'Ask the worker to scan this code'}
        </p>
      </div>
      
      {qrDataUrl ? (
        <img 
          src={qrDataUrl} 
          alt="QR Code" 
          className="w-48 h-48 rounded-lg"
        />
      ) : (
        <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
          <QrCode size={48} className="text-muted-foreground animate-pulse" />
        </div>
      )}
      
      <p className="text-caption text-muted-foreground mt-4">
        {isRTL ? 'يتم تحديث الرمز تلقائياً' : 'Code refreshes automatically'}
      </p>
    </div>
  );
}
