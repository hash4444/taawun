import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { Button } from '@/components/ui/button';
import { Camera, X, QrCode } from 'lucide-react';
import { parseQRData } from '@/hooks/useAttendance';

interface QRScannerProps {
  onScan: (data: { jobId: string; businessId: string; action: 'check_in' | 'check_out' }) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const { isRTL } = useApp();
  const [error, setError] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError(isRTL ? 'لا يمكن الوصول للكاميرا' : 'Cannot access camera');
    }
  }, [isRTL]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    
    const parsed = parseQRData(manualCode);
    if (parsed) {
      onScan({
        jobId: parsed.jobId,
        businessId: parsed.businessId,
        action: parsed.action,
      });
    } else {
      setError(isRTL ? 'رمز غير صالح' : 'Invalid code');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {isRTL ? 'مسح رمز QR' : 'Scan QR Code'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={24} />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-primary rounded-2xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>

        {error && (
          <div className="absolute bottom-4 left-4 right-4 p-4 bg-destructive/90 text-destructive-foreground rounded-lg text-center">
            {error}
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="p-4 border-t border-border bg-card">
        <p className="text-sm text-muted-foreground text-center mb-3">
          {isRTL ? 'أو أدخل الرمز يدوياً' : 'Or enter code manually'}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={isRTL ? 'أدخل الرمز...' : 'Enter code...'}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-background"
          />
          <Button onClick={handleManualSubmit}>
            <QrCode size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
