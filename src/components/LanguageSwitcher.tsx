import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-[#099aa7] focus:ring-offset-2"
      aria-label={language === 'en' ? 'التبديل إلى العربية' : 'التبديل إلى الإنجليزية'}
      title={language === 'en' ? 'العربية' : 'الإنجليزية'}
    >
      <Globe size={18} className="text-slate-600" aria-hidden="true" />
      <span className="text-sm font-semibold text-slate-700">
        {language === 'en' ? 'العربية' : 'الإنجليزية'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
