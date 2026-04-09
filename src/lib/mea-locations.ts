// Middle East and Africa countries with major cities
export interface Country {
  code: string;
  en: string;
  ar: string;
  cities: { en: string; ar: string }[];
}

export const MEA_COUNTRIES: Country[] = [
  // Middle East
  {
    code: 'SA', en: 'Saudi Arabia', ar: 'السعودية',
    cities: [
      { en: 'Riyadh', ar: 'الرياض' }, { en: 'Jeddah', ar: 'جدة' }, { en: 'Mecca', ar: 'مكة' },
      { en: 'Medina', ar: 'المدينة' }, { en: 'Dammam', ar: 'الدمام' }, { en: 'Khobar', ar: 'الخبر' },
      { en: 'Tabuk', ar: 'تبوك' }, { en: 'Abha', ar: 'أبها' }, { en: 'Taif', ar: 'الطائف' },
      { en: 'Hail', ar: 'حائل' }, { en: 'Jubail', ar: 'الجبيل' }, { en: 'Yanbu', ar: 'ينبع' },
      { en: 'Buraidah', ar: 'بريدة' }, { en: 'Najran', ar: 'نجران' }, { en: 'Jazan', ar: 'جازان' },
    ],
  },
  {
    code: 'AE', en: 'United Arab Emirates', ar: 'الإمارات',
    cities: [
      { en: 'Dubai', ar: 'دبي' }, { en: 'Abu Dhabi', ar: 'أبوظبي' }, { en: 'Sharjah', ar: 'الشارقة' },
      { en: 'Ajman', ar: 'عجمان' }, { en: 'Ras Al Khaimah', ar: 'رأس الخيمة' }, { en: 'Fujairah', ar: 'الفجيرة' },
    ],
  },
  {
    code: 'QA', en: 'Qatar', ar: 'قطر',
    cities: [
      { en: 'Doha', ar: 'الدوحة' }, { en: 'Al Wakrah', ar: 'الوكرة' }, { en: 'Al Khor', ar: 'الخور' },
    ],
  },
  {
    code: 'KW', en: 'Kuwait', ar: 'الكويت',
    cities: [
      { en: 'Kuwait City', ar: 'مدينة الكويت' }, { en: 'Hawalli', ar: 'حولي' }, { en: 'Salmiya', ar: 'السالمية' },
    ],
  },
  {
    code: 'BH', en: 'Bahrain', ar: 'البحرين',
    cities: [
      { en: 'Manama', ar: 'المنامة' }, { en: 'Riffa', ar: 'الرفاع' }, { en: 'Muharraq', ar: 'المحرق' },
    ],
  },
  {
    code: 'OM', en: 'Oman', ar: 'عُمان',
    cities: [
      { en: 'Muscat', ar: 'مسقط' }, { en: 'Salalah', ar: 'صلالة' }, { en: 'Sohar', ar: 'صحار' },
    ],
  },
  {
    code: 'JO', en: 'Jordan', ar: 'الأردن',
    cities: [
      { en: 'Amman', ar: 'عمّان' }, { en: 'Irbid', ar: 'إربد' }, { en: 'Zarqa', ar: 'الزرقاء' }, { en: 'Aqaba', ar: 'العقبة' },
    ],
  },
  {
    code: 'LB', en: 'Lebanon', ar: 'لبنان',
    cities: [
      { en: 'Beirut', ar: 'بيروت' }, { en: 'Tripoli', ar: 'طرابلس' }, { en: 'Sidon', ar: 'صيدا' },
    ],
  },
  {
    code: 'IQ', en: 'Iraq', ar: 'العراق',
    cities: [
      { en: 'Baghdad', ar: 'بغداد' }, { en: 'Basra', ar: 'البصرة' }, { en: 'Erbil', ar: 'أربيل' }, { en: 'Mosul', ar: 'الموصل' },
    ],
  },
  {
    code: 'PS', en: 'Palestine', ar: 'فلسطين',
    cities: [
      { en: 'Ramallah', ar: 'رام الله' }, { en: 'Gaza', ar: 'غزة' }, { en: 'Nablus', ar: 'نابلس' }, { en: 'Hebron', ar: 'الخليل' },
    ],
  },
  {
    code: 'YE', en: 'Yemen', ar: 'اليمن',
    cities: [
      { en: 'Sanaa', ar: 'صنعاء' }, { en: 'Aden', ar: 'عدن' }, { en: 'Taiz', ar: 'تعز' },
    ],
  },
  {
    code: 'SY', en: 'Syria', ar: 'سوريا',
    cities: [
      { en: 'Damascus', ar: 'دمشق' }, { en: 'Aleppo', ar: 'حلب' }, { en: 'Homs', ar: 'حمص' },
    ],
  },
  // North Africa
  {
    code: 'EG', en: 'Egypt', ar: 'مصر',
    cities: [
      { en: 'Cairo', ar: 'القاهرة' }, { en: 'Alexandria', ar: 'الإسكندرية' }, { en: 'Giza', ar: 'الجيزة' },
      { en: 'Sharm El Sheikh', ar: 'شرم الشيخ' }, { en: 'Luxor', ar: 'الأقصر' },
    ],
  },
  {
    code: 'MA', en: 'Morocco', ar: 'المغرب',
    cities: [
      { en: 'Casablanca', ar: 'الدار البيضاء' }, { en: 'Rabat', ar: 'الرباط' }, { en: 'Marrakech', ar: 'مراكش' },
      { en: 'Fes', ar: 'فاس' }, { en: 'Tangier', ar: 'طنجة' },
    ],
  },
  {
    code: 'TN', en: 'Tunisia', ar: 'تونس',
    cities: [
      { en: 'Tunis', ar: 'تونس العاصمة' }, { en: 'Sfax', ar: 'صفاقس' }, { en: 'Sousse', ar: 'سوسة' },
    ],
  },
  {
    code: 'DZ', en: 'Algeria', ar: 'الجزائر',
    cities: [
      { en: 'Algiers', ar: 'الجزائر العاصمة' }, { en: 'Oran', ar: 'وهران' }, { en: 'Constantine', ar: 'قسنطينة' },
    ],
  },
  {
    code: 'LY', en: 'Libya', ar: 'ليبيا',
    cities: [
      { en: 'Tripoli', ar: 'طرابلس' }, { en: 'Benghazi', ar: 'بنغازي' }, { en: 'Misrata', ar: 'مصراتة' },
    ],
  },
  {
    code: 'SD', en: 'Sudan', ar: 'السودان',
    cities: [
      { en: 'Khartoum', ar: 'الخرطوم' }, { en: 'Omdurman', ar: 'أم درمان' }, { en: 'Port Sudan', ar: 'بورتسودان' },
    ],
  },
  {
    code: 'MR', en: 'Mauritania', ar: 'موريتانيا',
    cities: [
      { en: 'Nouakchott', ar: 'نواكشوط' }, { en: 'Nouadhibou', ar: 'نواذيبو' },
    ],
  },
  // East Africa
  {
    code: 'KE', en: 'Kenya', ar: 'كينيا',
    cities: [
      { en: 'Nairobi', ar: 'نيروبي' }, { en: 'Mombasa', ar: 'مومباسا' }, { en: 'Kisumu', ar: 'كيسومو' },
    ],
  },
  {
    code: 'ET', en: 'Ethiopia', ar: 'إثيوبيا',
    cities: [
      { en: 'Addis Ababa', ar: 'أديس أبابا' }, { en: 'Dire Dawa', ar: 'دير داوا' },
    ],
  },
  {
    code: 'TZ', en: 'Tanzania', ar: 'تنزانيا',
    cities: [
      { en: 'Dar es Salaam', ar: 'دار السلام' }, { en: 'Dodoma', ar: 'دودوما' },
    ],
  },
  {
    code: 'UG', en: 'Uganda', ar: 'أوغندا',
    cities: [
      { en: 'Kampala', ar: 'كمبالا' }, { en: 'Entebbe', ar: 'عنتيبي' },
    ],
  },
  {
    code: 'RW', en: 'Rwanda', ar: 'رواندا',
    cities: [
      { en: 'Kigali', ar: 'كيغالي' },
    ],
  },
  {
    code: 'SO', en: 'Somalia', ar: 'الصومال',
    cities: [
      { en: 'Mogadishu', ar: 'مقديشو' }, { en: 'Hargeisa', ar: 'هرجيسا' },
    ],
  },
  {
    code: 'DJ', en: 'Djibouti', ar: 'جيبوتي',
    cities: [
      { en: 'Djibouti City', ar: 'مدينة جيبوتي' },
    ],
  },
  {
    code: 'ER', en: 'Eritrea', ar: 'إريتريا',
    cities: [
      { en: 'Asmara', ar: 'أسمرة' },
    ],
  },
  // West Africa
  {
    code: 'NG', en: 'Nigeria', ar: 'نيجيريا',
    cities: [
      { en: 'Lagos', ar: 'لاغوس' }, { en: 'Abuja', ar: 'أبوجا' }, { en: 'Kano', ar: 'كانو' },
    ],
  },
  {
    code: 'GH', en: 'Ghana', ar: 'غانا',
    cities: [
      { en: 'Accra', ar: 'أكرا' }, { en: 'Kumasi', ar: 'كوماسي' },
    ],
  },
  {
    code: 'SN', en: 'Senegal', ar: 'السنغال',
    cities: [
      { en: 'Dakar', ar: 'داكار' }, { en: 'Saint-Louis', ar: 'سانت لويس' },
    ],
  },
  {
    code: 'CI', en: "Côte d'Ivoire", ar: 'ساحل العاج',
    cities: [
      { en: 'Abidjan', ar: 'أبيدجان' }, { en: 'Yamoussoukro', ar: 'ياموسوكرو' },
    ],
  },
  {
    code: 'CM', en: 'Cameroon', ar: 'الكاميرون',
    cities: [
      { en: 'Douala', ar: 'دوالا' }, { en: 'Yaoundé', ar: 'ياوندي' },
    ],
  },
  // Southern Africa
  {
    code: 'ZA', en: 'South Africa', ar: 'جنوب أفريقيا',
    cities: [
      { en: 'Johannesburg', ar: 'جوهانسبرغ' }, { en: 'Cape Town', ar: 'كيب تاون' },
      { en: 'Durban', ar: 'ديربان' }, { en: 'Pretoria', ar: 'بريتوريا' },
    ],
  },
  {
    code: 'MZ', en: 'Mozambique', ar: 'موزمبيق',
    cities: [
      { en: 'Maputo', ar: 'مابوتو' },
    ],
  },
  {
    code: 'ZW', en: 'Zimbabwe', ar: 'زيمبابوي',
    cities: [
      { en: 'Harare', ar: 'هراري' }, { en: 'Bulawayo', ar: 'بولاوايو' },
    ],
  },
  {
    code: 'ZM', en: 'Zambia', ar: 'زامبيا',
    cities: [
      { en: 'Lusaka', ar: 'لوساكا' },
    ],
  },
  {
    code: 'AO', en: 'Angola', ar: 'أنغولا',
    cities: [
      { en: 'Luanda', ar: 'لواندا' },
    ],
  },
  {
    code: 'CD', en: 'DR Congo', ar: 'الكونغو الديمقراطية',
    cities: [
      { en: 'Kinshasa', ar: 'كينشاسا' }, { en: 'Lubumbashi', ar: 'لوبمباشي' },
    ],
  },
];

// Reverse geocode country code from coordinates
export function findCountryByCode(code: string): Country | undefined {
  return MEA_COUNTRIES.find((c) => c.code === code);
}
