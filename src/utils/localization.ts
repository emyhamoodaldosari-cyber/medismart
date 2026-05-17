export type AppLanguage = 'en' | 'ar';

export const isArabic = (language: AppLanguage) => language === 'ar';

export const getLocalizedText = <T>(language: AppLanguage, values: { en: T; ar: T }): T =>
  language === 'ar' ? values.ar : values.en;

export const formatCurrency = (value: number, language: AppLanguage) => {
  try {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${language === 'ar' ? 'ر.س' : 'SAR'}`;
  }
};

export const formatDate = (value: string, language: AppLanguage, options?: Intl.DateTimeFormatOptions) => {
  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const formatDateTime = (value: string, language: AppLanguage) => {
  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};
