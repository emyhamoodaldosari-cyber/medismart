import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ScrollToTop from './ScrollToTop';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { direction, t, language } = useLanguage();
  const socialIcons = [Twitter, Facebook, Instagram, Linkedin];
  const ecosystemLinks = React.useMemo(() => [
    t('footer.preciseSearch'),
    t('footer.trustedPharmacies'),
    t('footer.pharmacistSupport'),
    t('footer.orderTracking'),
  ], [t]);
  const categoryLinks = React.useMemo(() => [
    t('footer.prescriptionMedicines'),
    t('footer.otcMedicines'),
    t('footer.wellnessCare'),
    t('footer.familyCare'),
  ], [t]);

  return (
    <footer className="bg-[#1f2f31] text-white pt-12 pb-8 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          <div className="space-y-6">
            <div className={`flex items-center ${direction === 'rtl' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              <img src="/logo.png" alt="MediSmart Logo" className="w-12 h-12 rounded-xl bg-white p-1" />
              <span className="text-2xl font-heading font-bold tracking-tighter whitespace-nowrap">
                <span className="text-white">Medi</span>
                <span className="text-[#099aa7]">Smart</span>
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed text-[13px] font-medium max-w-xs">
              {t('footer.brandDescription')}
            </p>
            <div className={`flex ${direction === 'rtl' ? 'space-x-reverse space-x-5' : 'space-x-5'}`}>
              {socialIcons.map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#099aa7] hover:text-white hover:border-[#099aa7] transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-8">{t('footer.ecosystem')}</h4>
            <ul className="space-y-4 text-[13px] font-bold text-gray-400 uppercase tracking-widest">
              {ecosystemLinks.map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-8">{t('footer.categories')}</h4>
            <ul className="space-y-4 text-[13px] font-bold text-gray-400 uppercase tracking-widest">
              {categoryLinks.map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#099aa7] mb-8">{t('footer.contactCenter')}</h4>
            <ul className="space-y-6 text-[13px] font-medium text-gray-400">
              <li className={`flex items-start ${direction === 'rtl' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                <MapPin size={18} className="text-[#099aa7] mt-0.5 shrink-0" />
                <span>{t('footer.address')}</span>
              </li>
              <li className={`flex items-center ${direction === 'rtl' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                <Phone size={18} className="text-[#099aa7] shrink-0" />
                <span className="font-bold">+966 000 000 0000</span>
              </li>
              <li className={`flex items-center ${direction === 'rtl' ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                <Mail size={18} className="text-[#099aa7] shrink-0" />
                <span className="hover:text-white cursor-pointer transition-colors">dispatch@medismart.io</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex justify-center items-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 text-center">
            © {new Date().getFullYear()} MediSmart. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {children ?? <Outlet />}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Layout;
