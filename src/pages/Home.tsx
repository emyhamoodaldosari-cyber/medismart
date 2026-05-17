import React, { useState } from 'react';
import { Search, MapPin, MessageSquare, ShoppingCart, UserCheck, Activity, Phone, Mail, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/medicines?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-20 lg:pb-24 overflow-hidden bg-slate-50">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2f31" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left: Text Content */}
            <div className="lg:w-1/2">
              <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-[40rem] lg:text-start">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-slate-100 shadow-sm text-[10px] font-bold uppercase tracking-[0.2em] text-white mb-6 sm:mb-8" style={{ background: 'linear-gradient(135deg, #099aa7, #077a85)' }}>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  {t('home.hero.badge')}
                </div>
                <h1 className="max-w-[12ch] text-[clamp(2.8rem,8vw,5.6rem)] font-heading font-bold leading-[0.95] tracking-[-0.04em] text-[#1f2f31] mb-5 sm:mb-6 lg:max-w-[11ch]">
                  <span className="block">{t('home.hero.title')}</span>
                  <span className="block text-[#099aa7]">{t('home.hero.titleHighlight')}</span>
                  <span className="block">{t('home.hero.titleEnd')}</span>
                </h1>

                <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#363f40] leading-8 mb-8 opacity-80 font-medium lg:mx-0 lg:max-w-xl">
                  {t('home.hero.subtitle')}
                </p>

                {/* CTA Button */}
                <div className="mb-8 flex justify-center lg:justify-start">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 sm:px-10 py-4 bg-[#099aa7] text-white font-bold rounded-[24px] hover:bg-[#088a96] transition-all shadow-[0_8px_16px_rgba(9,154,167,0.2)] text-base gap-2"
                  >
                    {t('nav.getStarted')}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="lg:w-1/2 w-full">
              <div className="relative mx-auto max-w-2xl">
                <div className="absolute -inset-4 bg-[#099aa7]/5 blur-3xl rounded-[60px] -z-10"></div>
                <img 
                  src="/hero.png" 
                  alt="MediSmart System Hero" 
                  className="w-full rounded-[32px] lg:rounded-[48px] shadow-2xl shadow-slate-200/50 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-12 lg:mt-16">
            <div className="bg-white p-4 rounded-[32px] shadow-[0_20px_40px_rgba(31,47,49,0.08)] border border-slate-100 mb-8 max-w-4xl mx-auto">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={t('home.search.placeholder')}
                    className="w-full pl-14 pr-5 py-4 rounded-[24px] bg-gray-50/50 border border-transparent focus:bg-white focus:border-[#099aa7]/30 transition-all text-base outline-none font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="px-8 py-4 bg-[#099aa7] text-white font-bold rounded-[24px] hover:bg-[#088a96] transition-all shadow-[0_8px_16px_rgba(9,154,167,0.2)] text-base flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {t('home.search.button')}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
               {[
                 { icon: <Clock size={16} />, label: t('home.features.checkStock') },
                 { icon: <MessageSquare size={16} />, label: t('home.features.pharmacistChat') },
                 { icon: <UserCheck size={16} />, label: t('home.features.patientPortal') }
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <div className="text-[#099aa7]">{item.icon}</div>
                   <span>{item.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#1f2f31] mb-6 tracking-tight">
              {t('home.ecosystem.title')} <span className="text-[#099aa7]">{t('home.ecosystem.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-[#363f40] leading-relaxed opacity-70">
              {t('home.ecosystem.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                icon: <Activity />, 
                title: t('home.feature1.title'), 
                desc: t('home.feature1.desc')
              },
              { 
                icon: <ShoppingCart />, 
                title: t('home.feature2.title'), 
                desc: t('home.feature2.desc')
              },
              { 
                icon: <MessageSquare />, 
                title: t('home.feature3.title'), 
                desc: t('home.feature3.desc')
              }
            ].map((feature, idx) => (
              <div key={idx} className="group p-10 rounded-[48px] bg-white hover:bg-slate-50 transition-all duration-500 border border-slate-100 hover:border-[#099aa7]/20 shadow-sm hover:shadow-2xl hover:shadow-[#099aa7]/5">
                <div className="w-20 h-20 bg-[#099aa7]/10 text-[#099aa7] rounded-[24px] flex items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:bg-[#099aa7] group-hover:text-white">
                  {React.cloneElement(feature.icon as React.ReactElement, { size: 32 })}
                </div>
                <h3 className="text-2xl font-bold text-[#1f2f31] mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-[#363f40] leading-relaxed opacity-70 mb-10">{feature.desc}</p>
                <div className="flex items-center gap-4 pt-8 border-t border-slate-100">
                   <div>
                     <div className="text-2xl font-bold text-[#1f2f31]">93%</div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-[#099aa7]">{t('home.stats.savings')}</div>
                   </div>
                   <div className="w-px h-10 bg-slate-200 mx-4"></div>
                   <div>
                     <div className="text-2xl font-bold text-[#1f2f31]">24/7</div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('home.stats.services')}</div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-slate-50 text-[#1f2f31] overflow-hidden relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 tracking-tight leading-tight">
              {t('home.about.title')} <span className="text-[#099aa7]">{t('home.about.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-[#363f40] leading-relaxed opacity-80">
              {t('home.about.subtitle')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-teal-50 text-[#099aa7] rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 size={28} />
              </div>
              <div className="text-4xl font-bold text-[#1f2f31] mb-2">50+</div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#099aa7]">{t('home.stats.pharmacies')}</div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-teal-50 text-[#099aa7] rounded-2xl flex items-center justify-center mb-4">
                <UserCheck size={28} />
              </div>
              <div className="text-4xl font-bold text-[#1f2f31] mb-2">15k+</div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#099aa7]">{t('home.stats.users')}</div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-teal-50 text-[#099aa7] rounded-2xl flex items-center justify-center mb-4">
                <MapPin size={28} />
              </div>
              <div className="text-4xl font-bold text-[#1f2f31] mb-2">12+</div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#099aa7]">{t('home.stats.locations')}</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              t('home.feature.medicationHistory'),
              t('home.feature.prescriptionUpload'),
              t('home.feature.inAppChat'),
              t('home.feature.realTimeTracking'),
              t('home.feature.priceComparison'),
              t('home.feature.verifiedNetwork')
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-[#099aa7] flex items-center justify-center text-white flex-shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-sm font-bold text-[#363f40] opacity-80 uppercase tracking-wide">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20">
            <div className="lg:w-1/3">
              <h2 className="text-4xl font-heading font-bold text-[#1f2f31] mb-8 tracking-tight">{t('home.contact.title')}</h2>
              <p className="text-[#363f40] mb-12 leading-relaxed">
                {t('home.contact.subtitle')}
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#099aa7]">
                    <Phone size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('home.contact.emergencySupport')}</div>
                    <div className="text-lg font-bold text-[#1f2f31]">+966 000 000 0000</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#099aa7]">
                    <Mail size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('home.contact.emailAssistance')}</div>
                    <div className="text-lg font-bold text-[#1f2f31]">contact@medismart.io</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-2/3">
              <form className="bg-gray-50 p-10 md:p-14 rounded-[50px] space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">{t('home.contact.fullName')}</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] transition-all"
                      placeholder={t('home.contact.fullNamePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">{t('home.contact.emailAddress')}</label>
                    <input 
                      type="email" 
                      className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] transition-all"
                      placeholder={t('home.contact.emailPlaceholder')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">{t('home.contact.subject')}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] transition-all"
                    placeholder={t('home.contact.subjectPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#363f40] ml-1">{t('home.contact.message')}</label>
                  <textarea 
                    rows={5}
                    className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#099aa7]/20 focus:border-[#099aa7] transition-all resize-none"
                    placeholder={t('home.contact.messagePlaceholder')}
                  ></textarea>
                </div>
                <button type="button" className="w-1/2 mx-auto block py-5 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] transition-all shadow-xl shadow-[#099aa7]/10">
                  {t('home.contact.send')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
