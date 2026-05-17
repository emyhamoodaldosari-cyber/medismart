import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const { signIn, user, profile } = useAuth();
  const { t, direction } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    if (user && profile) {
      console.log('[Login] User authenticated with profile, preparing redirect:', {
        userId: user.id,
        role: profile.role,
        email: profile.email
      });

      const timer = setTimeout(() => {
        if (profile.role === 'admin') {
          console.log('[Login] ✓ Redirecting admin to /admin/dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else if (profile.role === 'pharmacist') {
          console.log('[Login] ✓ Redirecting pharmacist to /pharmacist/dashboard');
          navigate('/pharmacist/dashboard', { replace: true });
        } else if (profile.role === 'customer') {
          console.log('[Login] ✓ Redirecting customer to home or intended page');
          navigate(from || '/', { replace: true });
        } else {
          console.warn('[Login] ⚠️ Unknown role:', profile.role);
          console.warn('[Login] Redirecting to home page as fallback');
          navigate(from || '/', { replace: true });
        }
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (user) {
      console.log('[Login] User authenticated but profile still loading...');
    }
  }, [user, profile, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      console.warn('[Login] Attempt to login without required fields');
      showToast(t('auth.messages.loginMissingCredentials'), 'warning');
      return;
    }

    setLoading(true);
    console.log('[Login] Login attempt for:', email);
    
    try {
      await signIn(email, password);
      console.log('[Login] ✓ signIn completed, waiting for redirect...');
      showToast(t('auth.messages.loginSuccess'), 'success');
    } catch (err: any) {
      console.error('[Login] Login failed:', err?.message);
      const errorMessage = err?.message || t('auth.messages.loginError');
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const labelSpacing = direction === 'rtl' ? 'mr-1' : 'ml-1';
  const iconStart = direction === 'rtl' ? 'right-5' : 'left-5';
  const inputPadding = direction === 'rtl' ? 'pr-14 pl-4' : 'pl-14 pr-4';
  const passwordPadding = direction === 'rtl' ? 'pr-14 pl-14' : 'pl-14 pr-14';
  const toggleSide = direction === 'rtl' ? 'left-5' : 'right-5';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-[#1f2f31]/5 p-10 lg:p-14"
      >
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="MediSmart Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h2 className="text-3xl font-heading font-bold text-[#1f2f31] tracking-tight text-center">
            {t('auth.login.title')}
          </h2>
          <p className="text-[#363f40] mt-3 font-medium text-sm">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${labelSpacing}`}>
              {t('auth.login.email')}
            </label>
            <div className="relative group">
              <Mail className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
              <input
                type="email"
                required
                className={`w-full h-12 ${inputPadding} rounded-2xl bg-white shadow-sm border border-gray-100 focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className={`px-1 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {t('auth.login.password')}
              </label>
            </div>
            <div className="relative group">
              <Lock className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className={`w-full h-12 ${passwordPadding} rounded-2xl bg-white shadow-sm border border-gray-100 focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                placeholder={t('auth.login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${toggleSide} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors disabled:opacity-50`}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className={`${direction === 'rtl' ? 'text-left' : 'text-right'} px-1 mt-2`}>
              <Link
                to="/forgot-password"
                className="text-[10px] font-bold text-[#099aa7] hover:underline uppercase tracking-widest"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-3/4 mx-auto h-12 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] shadow-xl shadow-[#099aa7]/10 transition-all flex items-center justify-center uppercase tracking-widest text-[11px] disabled:opacity-50 mt-8"
          >
            {loading ? t('auth.login.processing') : t('auth.login.signInButton')}
          </button>
        </form>

        <p className="mt-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="text-[#099aa7] hover:underline">
            {t('auth.login.createAccount')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
