import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useLocation } from '@/hooks/useLocation';
import { MEA_COUNTRIES } from '@/lib/mea-locations';
import { MapPin, ChevronDown, LocateFixed, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LocationSelector() {
  const { isRTL } = useApp();
  const { country, city, cityIndex, detecting, setCountry, setCity, autoDetect } = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'country' | 'city'>('country');
  const [search, setSearch] = useState('');
  const [tempCountryCode, setTempCountryCode] = useState(country.code);

  const handleOpen = () => {
    setTempCountryCode(country.code);
    setStep('country');
    setSearch('');
    setOpen(true);
  };

  const handleCountrySelect = (code: string) => {
    setTempCountryCode(code);
    setSearch('');
    setStep('city');
  };

  const handleCitySelect = (index: number) => {
    setCountry(tempCountryCode);
    // Need a small delay so country is set first
    setTimeout(() => setCity(index), 0);
    setOpen(false);
  };

  const filteredCountries = MEA_COUNTRIES.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.en.toLowerCase().includes(q) || c.ar.includes(search);
  });

  const tempCountry = MEA_COUNTRIES.find((c) => c.code === tempCountryCode);
  const filteredCities = tempCountry?.cities.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.en.toLowerCase().includes(q) || c.ar.includes(search);
  }) ?? [];

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MapPin size={14} className="text-primary flex-shrink-0" />
        <span className="truncate max-w-[200px]">
          {detecting
            ? (isRTL ? 'جارٍ الكشف...' : 'Detecting...')
            : `${isRTL ? city.ar : city.en}, ${isRTL ? country.ar : country.en}`}
        </span>
        <ChevronDown size={14} className="flex-shrink-0 opacity-60" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-auto p-0 gap-0 rounded-2xl overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {step === 'country'
                  ? (isRTL ? 'اختر الدولة' : 'Select Country')
                  : (isRTL ? 'اختر المدينة' : 'Select City')}
              </DialogTitle>
              {step === 'city' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStep('country'); setSearch(''); }}
                  className="text-xs text-muted-foreground"
                >
                  {isRTL ? 'تغيير الدولة' : 'Change Country'}
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Auto-detect button */}
          <div className="px-4 pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await autoDetect();
                setOpen(false);
              }}
              disabled={detecting}
              className="w-full gap-2 text-primary border-primary/20 hover:bg-primary-light"
            >
              <LocateFixed size={16} />
              {detecting
                ? (isRTL ? 'جارٍ الكشف...' : 'Detecting...')
                : (isRTL ? 'كشف الموقع تلقائياً' : 'Auto-detect my location')}
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 pb-2">
            <Input
              placeholder={
                step === 'country'
                  ? (isRTL ? 'ابحث عن دولة...' : 'Search country...')
                  : (isRTL ? 'ابحث عن مدينة...' : 'Search city...')
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
            />
          </div>

          {/* List */}
          <ScrollArea className="h-[320px]">
            {step === 'country' ? (
              <div className="px-2 pb-2">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleCountrySelect(c.code)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-3 rounded-lg text-start hover:bg-muted transition-colors',
                      c.code === country.code && 'bg-primary-light'
                    )}
                  >
                    <span className="font-medium text-sm text-foreground">
                      {isRTL ? c.ar : c.en}
                    </span>
                    {c.code === country.code && (
                      <Check size={16} className="text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {isRTL ? 'لا توجد نتائج' : 'No results found'}
                  </p>
                )}
              </div>
            ) : (
              <div className="px-2 pb-2">
                <p className="text-xs text-muted-foreground px-3 py-1 mb-1">
                  {isRTL ? tempCountry?.ar : tempCountry?.en}
                </p>
                {filteredCities.map((c, idx) => {
                  const originalIdx = tempCountry!.cities.indexOf(c);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleCitySelect(originalIdx)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-3 rounded-lg text-start hover:bg-muted transition-colors',
                        tempCountryCode === country.code && originalIdx === cityIndex && 'bg-primary-light'
                      )}
                    >
                      <span className="font-medium text-sm text-foreground">
                        {isRTL ? c.ar : c.en}
                      </span>
                      {tempCountryCode === country.code && originalIdx === cityIndex && (
                        <Check size={16} className="text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
                {filteredCities.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {isRTL ? 'لا توجد نتائج' : 'No results found'}
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
