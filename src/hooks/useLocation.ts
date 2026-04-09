import { useState, useEffect, useCallback } from 'react';
import { MEA_COUNTRIES, Country } from '@/lib/mea-locations';

const STORAGE_KEY = 'taawun_location';

interface StoredLocation {
  countryCode: string;
  cityIndex: number;
}

export function useLocation() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(MEA_COUNTRIES[0]);
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [detecting, setDetecting] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: StoredLocation = JSON.parse(saved);
        const country = MEA_COUNTRIES.find((c) => c.code === parsed.countryCode);
        if (country) {
          setSelectedCountry(country);
          setSelectedCityIndex(Math.min(parsed.cityIndex, country.cities.length - 1));
        }
      } catch {
        // ignore
      }
    } else {
      // Auto-detect on first visit
      autoDetect();
    }
  }, []);

  // Persist whenever selection changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ countryCode: selectedCountry.code, cityIndex: selectedCityIndex })
    );
  }, [selectedCountry, selectedCityIndex]);

  const autoDetect = useCallback(async () => {
    setDetecting(true);
    try {
      // Use a free IP geolocation API
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const countryCode = data.country_code;
      const cityName = data.city;

      const country = MEA_COUNTRIES.find((c) => c.code === countryCode);
      if (country) {
        setSelectedCountry(country);
        const cityIdx = country.cities.findIndex(
          (c) => c.en.toLowerCase() === cityName?.toLowerCase()
        );
        setSelectedCityIndex(cityIdx >= 0 ? cityIdx : 0);
      }
    } catch {
      // Silently fall back to default (Saudi Arabia / Riyadh)
    } finally {
      setDetecting(false);
    }
  }, []);

  const setCountry = useCallback((code: string) => {
    const country = MEA_COUNTRIES.find((c) => c.code === code);
    if (country) {
      setSelectedCountry(country);
      setSelectedCityIndex(0);
    }
  }, []);

  const setCity = useCallback((index: number) => {
    setSelectedCityIndex(index);
  }, []);

  return {
    country: selectedCountry,
    cityIndex: selectedCityIndex,
    city: selectedCountry.cities[selectedCityIndex],
    detecting,
    setCountry,
    setCity,
    autoDetect,
  };
}
