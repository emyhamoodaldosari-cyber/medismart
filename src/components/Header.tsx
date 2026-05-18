import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { TERMINOLOGY } from '../constants/terminology';
import LanguageSwitcher from './LanguageSwitcher';
import ConfirmDialog from './ConfirmDialog';

const Header = () => {
  const { user, profile, signOut, isPharmacist, isAdmin, isCustomer } = useAuth();
  const { direction, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('/#')) {
      const id = path.substring(2);
      if (location.pathname !== '/') {
        e.preventDefault();
        navigate({ pathname: '/', hash: `#${id}` });
        return;
      }
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleMobileNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    handleNavClick(e, path);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  // Public navigation for non-authenticated users
  const publicLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.medicines'), path: '/medicines' },
    { name: t('nav.about'), path: '/#about' },
    { name: t('nav.contact'), path: '/#contact' },
  ];

  const customerLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.medicines'), path: '/medicines' },
    { name: t('nav.savedMedicines'), path: '/saved-medicines' },
    { name: t('nav.orders'), path: '/orders' },
    { name: t('nav.chat'), path: '/chat' },
  ];

  const pharmacistLinks = [
    { name: t('nav.dashboard'), path: '/pharmacist/dashboard' },
    { name: t('nav.inventory'), path: '/pharmacist/inventory' },
    { name: t('orders.title'), path: '/pharmacist/orders' },
    { name: t('nav.profile'), path: '/profile' },
  ];

  const adminLinks = [
    { name: t('nav.dashboard'), path: '/admin/dashboard' },
    { name: t('nav.users'), path: '/admin/users' },
    { name: t('nav.pharmacies'), path: '/admin/pharmacies' },
    { name: t('nav.categories'), path: '/admin/categories' },
    { name: t('nav.reports'), path: '/admin/reports' },
  ];

  const currentLinks = !user ? publicLinks : (isAdmin ? adminLinks : isPharmacist ? pharmacistLinks : customerLinks);

  React.useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    setShowLogoutDialog(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100/50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link 
          to={isAdmin ? '/admin/dashboard' : isPharmacist ? '/pharmacist/dashboard' : '/'} 
          className="flex items-center space-x-2"
          aria-label={t('app.name')}
        >
          <img src="/logo.png" alt="" className="h-10 w-auto object-contain" />
          <h1 className="text-2xl font-heading font-bold text-[#1f2f31] tracking-tight">
            {t('app.name')}
          </h1>
        </Link>

        <nav className="hidden lg:flex items-center space-x-8 text-[15px] font-medium text-[#4a5568]" aria-label="التنقل الرئيسي">
          {currentLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              onClick={(e) => handleNavClick(e, link.path)}
              className={`transition-colors relative py-2 ${
                isActive(link.path) ? 'text-[#099aa7] font-semibold' : 'hover:text-[#099aa7]'
              }`}
              aria-current={isActive(link.path) ? 'page' : undefined}
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center space-x-6">
          <LanguageSwitcher />
          
          {user && profile && (
            <div className="px-4 py-2 rounded-full bg-[#099aa7]/10 text-[#099aa7] text-xs font-bold uppercase tracking-widest" aria-label={`${t('profile.role')}: ${profile.role}`}>
              {profile.role}
            </div>
          )}

          {user && isCustomer && (
            <button 
              onClick={() => navigate('/cart')} 
              className="relative group text-[#4a5568] hover:text-[#099aa7] transition-colors focus:outline-none focus:ring-2 focus:ring-[#099aa7] rounded-lg p-2"
              aria-label={t('cart.title')}
            >
              <ShoppingCart size={22} strokeWidth={1.5} />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#099aa7] text-white text-[10px] font-bold flex items-center justify-center rounded-full" aria-hidden="true">2</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate('/profile')} 
                className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#099aa7] rounded-lg p-2"
                aria-label={t('nav.profile')}
              >
                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#1f2f31] group-hover:border-[#099aa7] group-hover:text-[#099aa7] transition-all overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.full_name || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <span className="text-sm font-semibold text-[#1f2f31]">{profile?.full_name?.split(' ')[0]}</span>
              </button>
              <button 
                onClick={() => setShowLogoutDialog(true)} 
                className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg p-2"
                aria-label={t('nav.signOut')}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/register" 
                className="px-5 py-2.5 text-[#099aa7] font-bold rounded-lg hover:bg-[#099aa7]/5 transition-all text-[13px]"
              >
                {t('auth.signUp')}
              </Link>
              <Link 
                to="/login" 
                className="px-7 py-3 bg-[#099aa7] text-white rounded-lg text-[13px] font-bold hover:bg-[#088a96] transition-all shadow-lg shadow-[#099aa7]/20 focus:outline-none focus:ring-2 focus:ring-[#099aa7] focus:ring-offset-2"
              >
                {t('nav.signIn')}
              </Link>
            </div>
          )}
        </div>

        <button 
          className="lg:hidden p-2 text-[#1f2f31] focus:outline-none focus:ring-2 focus:ring-[#099aa7] rounded-lg"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col space-y-6">
              <LanguageSwitcher />
              {currentLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => handleMobileNavClick(e, link.path)}
                  className={`text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#099aa7] rounded-lg p-2 ${
                    isActive(link.path) ? 'text-[#099aa7]' : 'text-[#1f2f31]'
                  }`}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-6 border-t border-gray-50">
                {user ? (
                  <div className="flex flex-col gap-4">
                    <div className="text-sm font-semibold text-[#363f40]">
                      {profile?.full_name} • <span className="text-[#099aa7] uppercase text-xs">{profile?.role}</span>
                    </div>
                    <Link 
                      to="/profile" 
                      className="text-lg font-semibold text-[#1f2f31] focus:outline-none focus:ring-2 focus:ring-[#099aa7] rounded-lg p-2" 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('nav.profile')}
                    </Link>
                    <button 
                      onClick={() => { setShowLogoutDialog(true); setIsMenuOpen(false); }} 
                      className="text-lg font-semibold text-red-500 text-left focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg p-2"
                    >
                      {t('nav.signOut')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link 
                      to="/register" 
                      className="w-full py-4 bg-slate-100 text-[#1f2f31] rounded-xl text-center font-bold hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#099aa7] focus:ring-offset-2" 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('auth.signUp')}
                    </Link>
                    <Link 
                      to="/login" 
                      className="w-full py-4 bg-[#099aa7] text-white rounded-xl text-center font-bold hover:bg-[#088a96] focus:outline-none focus:ring-2 focus:ring-[#099aa7] focus:ring-offset-2" 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('nav.signIn')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title={t('auth.confirmLogout')}
        message={t('auth.confirmLogoutMessage')}
        confirmText={t('nav.signOut')}
        type="warning"
      />
    </header>
  );
};

export default Header;
