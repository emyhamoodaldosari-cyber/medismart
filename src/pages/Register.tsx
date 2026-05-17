import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t, direction } = useLanguage();
  const { showToast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 6) {
      showToast(t('auth.messages.passwordTooShort'), 'error');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showToast(t('auth.messages.passwordMismatch'), 'error');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, fullName);
      showToast(t('auth.messages.registerSuccess'), 'success');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err: any) {
      showToast(err?.message || t('auth.messages.registerError'), 'error');
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-[#1f2f31]/5 p-8 lg:p-10 my-6"
      >
        <div className="mb-4 text-center">
          <img src="/logo.png" alt="MediSmart Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
          <h2 className="text-3xl font-heading font-bold text-[#1f2f31] tracking-tight text-center">{t('auth.register.title')}</h2>
          <p className="text-[#363f40] mt-3 font-medium text-sm">{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${labelSpacing}`}>{t('auth.register.fullName')}</label>
            <div className="relative group">
              <User className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
              <input
                type="text"
                required
                className={`w-full h-11 ${inputPadding} rounded-2xl bg-white shadow-sm border border-gray-100 focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                placeholder={t('auth.register.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${labelSpacing}`}>{t('auth.register.email')}</label>
            <div className="relative group">
              <Mail className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
              <input
                type="email"
                required
                className={`w-full h-11 ${inputPadding} rounded-2xl bg-white shadow-sm border border-gray-100 focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                placeholder={t('auth.register.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${labelSpacing}`}>{t('auth.register.password')}</label>
            <div className="relative group">
              <Lock className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className={`w-full h-11 ${passwordPadding} rounded-2xl bg-white shadow-sm border border-gray-100 focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                placeholder={t('auth.register.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute ${toggleSide} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${labelSpacing}`}>{t('auth.register.confirmPassword')}</label>
            <div className="relative group">
              <Lock className={`absolute ${iconStart} top-1/2 -translate-y-1/2 text-[#099aa7] transition-colors`} size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className={`w-full h-11 ${inputPadding} rounded-2xl bg-white shadow-sm border border-gray-100 focus:ring-4 focus:ring-[#099aa7]/10 transition-all font-bold text-[#363f40] outline-none text-sm`}
                placeholder={t('auth.register.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-3/4 mx-auto h-12 bg-[#099aa7] text-white font-bold rounded-2xl hover:bg-[#088a96] shadow-xl shadow-[#099aa7]/10 transition-all flex items-center justify-center uppercase tracking-widest text-[11px] disabled:opacity-50 mt-4"
          >
            {loading ? t('auth.register.processing') : t('auth.register.registerButton')}
          </button>
        </form>

        <p className="mt-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="text-[#099aa7] hover:underline">{t('auth.register.login')}</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
