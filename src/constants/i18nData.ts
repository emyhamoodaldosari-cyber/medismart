import { TRANSLATIONS as BASE_TRANSLATIONS } from './translations';
import { CUSTOMER_SECTIONS } from './customerSections';

export const I18N_DATA = {
  en: {
    ...BASE_TRANSLATIONS.en,
    customer: CUSTOMER_SECTIONS.en,
  },
  ar: {
    ...BASE_TRANSLATIONS.ar,
    customer: CUSTOMER_SECTIONS.ar,
  },
} as const;

export type I18nData = typeof I18N_DATA;
